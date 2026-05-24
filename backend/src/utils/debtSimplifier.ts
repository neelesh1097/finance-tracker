interface MemberBalance {
  userId: string;
  balance: number; // Positive means owed money, negative means owes money
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export function simplifyDebts(balancesMap: Record<string, number>): Settlement[] {
  const balances: MemberBalance[] = Object.entries(balancesMap)
    .map(([userId, balance]) => ({ userId, balance: Math.round(balance * 100) / 100 }))
    .filter(m => Math.abs(m.balance) > 0.01);

  const settlements: Settlement[] = [];
  
  // Separate into debtors and creditors
  let debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance); // Most negative first
  let creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance); // Most positive first

  let safetyCount = 0;
  const maxIterations = balances.length * 2;

  while (debtors.length > 0 && creditors.length > 0 && safetyCount < maxIterations) {
    safetyCount++;
    const debtor = debtors[0];
    const creditor = creditors[0];

    const amountToSettle = Math.min(Math.abs(debtor.balance), creditor.balance);
    const roundedAmount = Math.round(amountToSettle * 100) / 100;

    if (roundedAmount > 0) {
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: roundedAmount,
      });
    }

    debtor.balance += roundedAmount;
    creditor.balance -= roundedAmount;

    // Filter out settled users and re-sort
    debtors = debtors.filter(b => Math.abs(b.balance) > 0.01).sort((a, b) => a.balance - b.balance);
    creditors = creditors.filter(b => Math.abs(b.balance) > 0.01).sort((a, b) => b.balance - a.balance);
  }

  return settlements;
}
