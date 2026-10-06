import { cedis, cloneLife, logLine, type Bank, type Life, type StepResult } from "@/lib/game/world";

export const DAILY_RATE = 0.002;
export const DAILY_CAP = 200;
export const LOAN_MARKUP = 0.15;
export const LOAN_DAYS = 14;

function bankOf(life: Life): Bank {
  return life.bank ?? { savings: 0, lastInterest: life.minutes, loan: 0, loanDue: 0, score: 600 };
}

export function interestDue(life: Life) {
  const bank = bankOf(life);
  if (bank.savings < 1) return 0;
  const days = Math.min(30, Math.max(0, (life.minutes - bank.lastInterest) / 1440));
  return Math.floor(Math.min(DAILY_CAP, bank.savings * DAILY_RATE) * days);
}

export function loanLimit(life: Life) {
  return Math.max(0, (bankOf(life).score - 300) * 40);
}

export function scoreLabel(score: number) {
  if (score >= 750) return "Excellent";
  if (score >= 650) return "Good";
  if (score >= 550) return "Fair";
  return "Poor";
}

function settled(life: Life) {
  const next = cloneLife(life);
  const bank = bankOf(life);
  const gain = interestDue(life);
  const days = Math.floor((life.minutes - bank.lastInterest) / 1440);
  next.bank = { ...bank, savings: bank.savings + gain, lastInterest: bank.savings < 1 ? life.minutes : bank.lastInterest + Math.max(0, days) * 1440 };
  return { next, gain };
}

export function deposit(life: Life, amount: number): StepResult {
  const value = Math.floor(amount);
  if (!Number.isFinite(value) || value < 1) return { life, notes: [], error: "Enter an amount." };
  if (life.cash < value) return { life, notes: [], error: "You do not have that much cash." };
  const { next, gain } = settled(life);
  next.cash -= value;
  next.bank = { ...next.bank!, savings: next.bank!.savings + value };
  return { life: next, notes: [`Saved ${cedis(value)}.${gain ? ` Interest added: ${cedis(gain)}.` : ""}`] };
}

export function withdraw(life: Life, amount: number): StepResult {
  const value = Math.floor(amount);
  const { next, gain } = settled(life);
  if (!Number.isFinite(value) || value < 1) return { life, notes: [], error: "Enter an amount." };
  if (next.bank!.savings < value) return { life, notes: [], error: `Your savings are ${cedis(next.bank!.savings)}.` };
  next.cash += value;
  next.bank = { ...next.bank!, savings: next.bank!.savings - value };
  return { life: next, notes: [`Withdrew ${cedis(value)}.${gain ? ` Interest added: ${cedis(gain)}.` : ""}`] };
}

export function collectInterest(life: Life): StepResult {
  const { next, gain } = settled(life);
  if (gain < 1) return { life, notes: [], error: "No interest yet. It builds up daily." };
  return { life: next, notes: [`${cedis(gain)} interest added to savings.`] };
}

export function takeLoan(life: Life, amount: number): StepResult {
  const value = Math.floor(amount);
  const bank = bankOf(life);
  if (bank.loan > 0) return { life, notes: [], error: "Clear your current loan first." };
  if (!Number.isFinite(value) || value < 100) return { life, notes: [], error: "Loans start at ₵100." };
  if (value > loanLimit(life)) return { life, notes: [], error: `Your limit is ${cedis(loanLimit(life))}. A better credit score raises it.` };
  const next = cloneLife(life);
  next.cash += value;
  next.bank = { ...bank, loan: Math.round(value * (1 + LOAN_MARKUP)), loanDue: life.minutes + LOAN_DAYS * 1440 };
  logLine(next, `Bank loan of ${cedis(value)}. Repay ${cedis(next.bank.loan)} within ${LOAN_DAYS} days.`);
  return { life: next, notes: [`${cedis(value)} is in your wallet. Repay ${cedis(next.bank.loan)} within ${LOAN_DAYS} days.`] };
}

export function repayBank(life: Life, amount: number): StepResult {
  const bank = bankOf(life);
  if (bank.loan < 1) return { life, notes: [], error: "No bank loan." };
  const value = Math.min(Math.floor(amount), bank.loan, life.cash);
  if (!Number.isFinite(value) || value < 1) return { life, notes: [], error: "Not enough cash to repay." };
  const next = cloneLife(life);
  next.cash -= value;
  const left = bank.loan - value;
  const onTime = life.minutes <= bank.loanDue;
  next.bank = { ...bank, loan: left, score: left === 0 ? Math.min(850, bank.score + (onTime ? 30 : 10)) : bank.score };
  return { life: next, notes: [left === 0 ? `Loan cleared.${onTime ? " On time, so your credit score went up." : ""}` : `Repaid ${cedis(value)}. ${cedis(left)} left.`] };
}
