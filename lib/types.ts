export type Role = "ADMIN" | "MANAGER" | "CASHIER";
export type EntryStatus = "DRAFT" | "LOCKED";
export type ShiftType = "FULL" | "CLOSING";
export type PaymentSource = "CASH" | "CARD";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type WorkSchedule = {
  userId: string;
  date: string;
  working: boolean;
  hoursLabel: string;
  closingOnly: boolean;
  shiftType: ShiftType;
};

export type ScheduleRow = WorkSchedule & {
  name: string;
  email: string;
  userId: string;
};

export type OpeningHint = {
  amount: number;
  fromDate: string;
  source?: "PREVIOUS_DAY" | "SAME_DAY_HANDOVER" | "NONE";
  handoverCashierName?: string | null;
  handoverPending?: boolean;
};

export type Platforms = {
  wolt: boolean;
  bolt: boolean;
  uberEats: boolean;
  glovo: boolean;
  other: boolean;
};

export type ExpenseInvoice = {
  id: string;
  filename: string;
};

/** Photo picked on device, not yet uploaded */
export type PendingInvoicePhoto = {
  uri: string;
  name: string;
  mimeType?: string;
};

export type ExpenseLine = {
  id?: string;
  category: string;
  description: string;
  amount: number;
  paymentSource: PaymentSource;
  invoices?: ExpenseInvoice[];
  /** @deprecated first invoice — use invoices */
  invoice?: ExpenseInvoice;
  pendingPhotos?: PendingInvoicePhoto[];
};

export type EntryFormData = {
  openingBalance: number;
  cashSales: number;
  cardSales: number;
  woltSales: number;
  boltSales: number;
  uberEatsSales: number;
  glovoSales: number;
  otherPlatformSales: number;
  cashRefunds: number;
  cardRefunds: number;
  platformRefunds: number;
  bankDeposit: number;
  cashWithdrawal: number;
  ownerWithdrawal: number;
  actualCashCounted: number;
  notes: string;
};

export type DailyEntry = EntryFormData & {
  id: string;
  date: string;
  cashierId: string;
  status: EntryStatus;
  difference: number;
  closingOnly?: boolean;
  shiftType?: ShiftType;
  schedule?: WorkSchedule;
  expenses?: ExpenseLine[];
};

export const emptyEntryForm = (): EntryFormData => ({
  openingBalance: 0,
  cashSales: 0,
  cardSales: 0,
  woltSales: 0,
  boltSales: 0,
  uberEatsSales: 0,
  glovoSales: 0,
  otherPlatformSales: 0,
  cashRefunds: 0,
  cardRefunds: 0,
  platformRefunds: 0,
  bankDeposit: 0,
  cashWithdrawal: 0,
  ownerWithdrawal: 0,
  actualCashCounted: 0,
  notes: "",
});

export const emptyExpenseLine = (): ExpenseLine => ({
  category: "OTHER",
  description: "",
  amount: 0,
  paymentSource: "CASH",
});
