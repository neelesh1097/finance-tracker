import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../middlewares/error.middleware';
import { Role, Prisma } from '@prisma/client';
import { logger } from '../config/logger';
import { prisma } from '../config/db';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const JWT_SECRET = process.env.JWT_SECRET || 'finance_jwt_access_secret_key_change_me_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'finance_jwt_refresh_secret_key_change_me_in_production';

export class AuthService {
  private userRepository = new UserRepository();

  async register(data: any, ip?: string, userAgent?: string) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('Email already registered', 400);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Create verification token (simple 6-digit code or hex)
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: Role.USER, // Default role
      emailVerified: false,
      verificationToken,
      verificationTokenExp,
    });

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        ipAddress: ip || null,
        userAgent: userAgent || null,
      },
    });

    logger.info(`User registered: ${user.email} (Token: ${verificationToken})`);

    // In a real application, we would email the verification code.
    // We'll return it in development/testing mode so the user can copy it.
    return {
      message: 'Registration successful. Verification code sent to email.',
      userId: user.id,
      email: user.email,
      devVerificationToken: verificationToken, // sent to UI for demonstration
    };
  }

  async login(credentials: any, ip?: string, userAgent?: string) {
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check email verification status
    // The dashboard blocking is done in the middleware / route level, but login should still work.
    // If not verified, we let them login but return state so frontend can show Verification screen.
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await this.userRepository.update(user.id, { refreshToken });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGGED_IN',
        ipAddress: ip || null,
        userAgent: userAgent || null,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        monthlyIncome: Number(user.monthlyIncome),
      },
    };
  }

  async verifyEmail(email: string, token: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    if (user.verificationToken !== token) {
      throw new AppError('Invalid verification token', 400);
    }

    if (user.verificationTokenExp && new Date() > user.verificationTokenExp) {
      throw new AppError('Verification token has expired', 400);
    }

    await this.userRepository.update(user.id, {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExp: null,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_VERIFIED',
      },
    });

    return { message: 'Email verified successfully.' };
  }

  async resendVerification(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.emailVerified) {
      throw new AppError('Email already verified', 400);
    }

    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExp = new Date(Date.now() + 15 * 60 * 1000);

    await this.userRepository.update(user.id, {
      verificationToken,
      verificationTokenExp,
    });

    logger.info(`Resent Verification code to ${user.email}: ${verificationToken}`);

    return {
      message: 'Verification code resent.',
      devVerificationToken: verificationToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // For security, don't disclose user existence. Just return generic.
      return { message: 'If the email exists, a password reset link has been generated.' };
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // simple numeric token
    const resetTokenExp = new Date(Date.now() + 15 * 60 * 1000);

    await this.userRepository.update(user.id, {
      resetToken,
      resetTokenExp,
    });

    logger.info(`Password reset code for ${user.email}: ${resetToken}`);

    return {
      message: 'Password reset code generated.',
      devResetToken: resetToken,
    };
  }

  async resetPassword(data: any) {
    const { token, password } = data;
    
    // Find user by reset token
    const users = await prisma.user.findMany({
      where: {
        resetToken: token,
        resetTokenExp: {
          gte: new Date(),
        },
      },
    });

    if (users.length === 0) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const user = users[0];
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    await this.userRepository.update(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExp: null,
      refreshToken: null, // Revoke all sessions on password change
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_SUCCESS',
      },
    });

    return { message: 'Password reset successful.' };
  }

  async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as {
        id: string;
        email: string;
      };

      const user = await this.userRepository.findById(decoded.id);
      if (!user || user.refreshToken !== token) {
        throw new AppError('Invalid refresh token.', 401);
      }

      const accessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      await this.userRepository.update(user.id, { refreshToken: newRefreshToken });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err) {
      throw new AppError('Invalid or expired refresh token.', 401);
    }
  }

  async logout(userId: string) {
    await this.userRepository.update(userId, { refreshToken: null });
    return { message: 'Logged out successfully.' };
  }

  private generateAccessToken(user: any): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  }

  private generateRefreshToken(user: any): string {
    return jwt.sign(
      { id: user.id, email: user.email },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
  }

  async updateIncome(userId: string, monthlyIncome: number) {
    if (typeof monthlyIncome !== 'number' || monthlyIncome < 0 || isNaN(monthlyIncome)) {
      throw new AppError('Invalid monthly income amount', 400);
    }
    const user = await this.userRepository.update(userId, {
      monthlyIncome: new Prisma.Decimal(monthlyIncome),
    });
    return {
      message: 'Monthly income updated successfully.',
      monthlyIncome: Number(user.monthlyIncome),
    };
  }
}
