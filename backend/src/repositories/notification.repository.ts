import { prisma } from '../config/db';
import { Notification, NotificationType } from '@prisma/client';

export class NotificationRepository {
  async create(userId: string, message: string, type: NotificationType): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId,
        message,
        type,
      },
    });
  }

  async findAllByUser(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
