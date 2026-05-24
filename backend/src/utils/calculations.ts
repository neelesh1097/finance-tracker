export function calculateSimpleInterest(principal: number, ratePercent: number, timeYears: number): number {
  return (principal * ratePercent * timeYears) / 100;
}

export function calculateCompoundInterest(principal: number, annualRatePercent: number, compoundsPerYear: number, timeYears: number): number {
  const r = annualRatePercent / 100;
  const n = compoundsPerYear;
  const t = timeYears;
  return principal * Math.pow(1 + r / n, n * t);
}

export function calculateSIP(monthlyContribution: number, annualReturnPercent: number, timeYears: number): {
  totalInvested: number;
  futureValue: number;
  totalReturns: number;
} {
  const i = (annualReturnPercent / 100) / 12;
  const n = timeYears * 12;
  
  let futureValue = 0;
  if (i === 0) {
    futureValue = monthlyContribution * n;
  } else {
    // Formula: M * [ ( (1 + i)^n - 1 ) / i ] * (1 + i)
    futureValue = monthlyContribution * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  }
  
  const totalInvested = monthlyContribution * n;
  const totalReturns = futureValue - totalInvested;
  
  return {
    totalInvested: Math.round(totalInvested * 100) / 100,
    futureValue: Math.round(futureValue * 100) / 100,
    totalReturns: Math.round(totalReturns * 100) / 100,
  };
}

export function calculateCAGR(beginningValue: number, endingValue: number, years: number): number {
  if (beginningValue <= 0 || endingValue <= 0 || years <= 0) return 0;
  return Math.pow(endingValue / beginningValue, 1 / years) - 1;
}

interface CashFlow {
  amount: number;
  date: Date;
}

// XIRR calculation using Newton-Raphson method
export function calculateXIRR(cashFlows: CashFlow[]): number {
  if (cashFlows.length < 2) return 0;

  // Find first date
  const t0 = cashFlows[0].date.getTime();
  
  // Map to format (amount, time in years from t0)
  const flows = cashFlows.map(cf => ({
    amount: cf.amount,
    t: (cf.date.getTime() - t0) / (1000 * 60 * 60 * 24 * 365)
  }));

  // NPV function
  const npv = (rate: number): number => {
    return flows.reduce((acc, flow) => {
      return acc + flow.amount / Math.pow(1 + rate, flow.t);
    }, 0);
  };

  // Derivative of NPV
  const npvDerivative = (rate: number): number => {
    return flows.reduce((acc, flow) => {
      if (flow.t === 0) return acc;
      return acc - flow.t * flow.amount / Math.pow(1 + rate, flow.t + 1);
    }, 0);
  };

  // Newton-Raphson iteration
  let rate = 0.1; // Start guess at 10%
  const maxIterations = 100;
  const tolerance = 1e-6;

  for (let i = 0; i < maxIterations; i++) {
    const y = npv(rate);
    const dy = npvDerivative(rate);

    if (Math.abs(dy) < 1e-12) {
      break; // Avoid division by zero
    }

    const nextRate = rate - y / dy;

    // Check convergence
    if (Math.abs(nextRate - rate) < tolerance) {
      return nextRate; // Return rate
    }

    rate = nextRate;
  }

  // Fallback: If Newton-Raphson fails to converge, try a simple bisection search
  let low = -0.999;
  let high = 2.0;
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const y = npv(mid);
    if (Math.abs(y) < tolerance) {
      return mid;
    }
    if (y > 0) {
      // In investments, higher rate lowers NPV
      // If we have standard investment flows (negative then positive)
      // Check slope: if npv(-0.9) > 0 and npv(2) < 0
      const yLow = npv(low);
      if (yLow > 0) {
        low = mid;
      } else {
        high = mid;
      }
    } else {
      const yLow = npv(low);
      if (yLow > 0) {
        high = mid;
      } else {
        low = mid;
      }
    }
  }

  return rate;
}
