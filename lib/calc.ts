import type { DailyEntry, EntryFormData, ExpenseLine, PaymentSource } from "./types";

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function totalSales(d: EntryFormData) {
  return (
    d.cashSales +
    d.cardSales +
    d.woltSales +
    d.boltSales +
    d.uberEatsSales +
    d.glovoSales +
    d.otherPlatformSales
  );
}

export function totalPayouts(d: EntryFormData) {
  return d.bankDeposit + d.cashWithdrawal + d.ownerWithdrawal;
}

export function totalExpenseLines(expenses: ExpenseLine[]) {
  return expenses.reduce((s, e) => s + (e.amount || 0), 0);
}

export function expenseTotalBySource(expenses: ExpenseLine[], source: PaymentSource) {
  return expenses
    .filter((e) => (e.paymentSource || "CASH") === source)
    .reduce((s, e) => s + (e.amount || 0), 0);
}

/** Book expected drawer: opening + cash sales − refunds − cash expenses − payouts. */
export function bookExpectedCash(d: EntryFormData, expenses: ExpenseLine[]) {
  return (
    d.openingBalance +
    d.cashSales -
    d.cashRefunds -
    expenseTotalBySource(expenses, "CASH") -
    totalPayouts(d)
  );
}

/** Expected cash in drawer — same as bookExpectedCash. */
export function closingBalance(d: EntryFormData, expenses: ExpenseLine[]) {
  return bookExpectedCash(d, expenses);
}

export function cashDifference(d: EntryFormData, expenses: ExpenseLine[]) {
  return num(d.actualCashCounted) - bookExpectedCash(d, expenses);
}

export function fmt(n: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(num(n));
}

export function entryToFormData(e: DailyEntry): EntryFormData {
  return {
    openingBalance: num(e.openingBalance),
    cashSales: num(e.cashSales),
    cardSales: num(e.cardSales),
    woltSales: num(e.woltSales),
    boltSales: num(e.boltSales),
    uberEatsSales: num(e.uberEatsSales),
    glovoSales: num(e.glovoSales),
    otherPlatformSales: num(e.otherPlatformSales),
    cashRefunds: num(e.cashRefunds),
    cardRefunds: num(e.cardRefunds),
    platformRefunds: num(e.platformRefunds),
    bankDeposit: num(e.bankDeposit),
    cashWithdrawal: num(e.cashWithdrawal),
    ownerWithdrawal: num(e.ownerWithdrawal),
    actualCashCounted: num(e.actualCashCounted),
    notes: e.notes || "",
  };
}

export function reportReadyToSubmit(
  form: EntryFormData,
  closingOnly: boolean
): boolean {
  const opening = num(form.openingBalance);
  const actual = num(form.actualCashCounted);
  if (closingOnly) return opening > 0 && actual > 0;
  const sales = totalSales(form);
  return opening > 0 && sales > 0 && actual > 0;
}
