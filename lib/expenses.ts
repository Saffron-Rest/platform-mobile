import { api, getToken } from "./api";
import { getApiBaseUrl } from "./config";
import type { ExpenseInvoice, ExpenseLine, PendingInvoicePhoto } from "./types";

function mapInvoice(raw: Record<string, unknown>): ExpenseInvoice {
  return {
    id: String(raw.id),
    filename: String(raw.filename ?? "invoice"),
  };
}

export function mapExpenseLine(raw: Record<string, unknown>): ExpenseLine {
  const invoicesRaw = raw.invoices as Record<string, unknown>[] | undefined;
  const invoices = invoicesRaw?.length
    ? invoicesRaw.map(mapInvoice)
    : raw.invoice
      ? [mapInvoice(raw.invoice as Record<string, unknown>)]
      : [];
  return {
    id: raw.id as string | undefined,
    category: String(raw.category ?? "OTHER"),
    description: String(raw.description ?? ""),
    amount: Number(raw.amount) || 0,
    paymentSource: (raw.paymentSource as ExpenseLine["paymentSource"]) || "CASH",
    invoices,
    invoice: invoices[0],
    pendingPhotos: [],
  };
}

export async function loadExpenses(entryId: string): Promise<ExpenseLine[]> {
  const raw = await api<Record<string, unknown>[]>(`/expenses/entry/${entryId}`);
  return raw.map(mapExpenseLine);
}

export function expensesForSync(expenses: ExpenseLine[]) {
  return expenses.filter(
    (e) => Boolean(e.id) || e.amount > 0 || Boolean(e.description?.trim())
  );
}

export async function syncExpenses(entryId: string, expenses: ExpenseLine[]) {
  const payload = expensesForSync(expenses).map((e) => ({
    ...(e.id ? { id: e.id } : {}),
    category: e.category,
    description: e.description,
    amount: e.amount,
    paymentSource: e.paymentSource || "CASH",
  }));
  const raw = await api<Record<string, unknown>[]>(`/expenses/entry/${entryId}/sync`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return raw.map(mapExpenseLine);
}

export async function uploadExpenseInvoice(
  expenseId: string,
  photo: PendingInvoicePhoto
): Promise<ExpenseLine> {
  const token = await getToken();
  const form = new FormData();
  const mime = photo.mimeType ?? "image/jpeg";
  const name = photo.name || `invoice-${Date.now()}.jpg`;
  form.append("invoice", {
    uri: photo.uri,
    name,
    type: mime,
  } as unknown as Blob);

  const res = await fetch(`${getApiBaseUrl()}/expenses/${expenseId}/invoice`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const msg =
      (typeof err.error === "string" && err.error) ||
      (typeof err.message === "string" && err.message) ||
      "Invoice upload failed";
    throw new Error(msg);
  }
  const body = await res.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid response from server");
  }
  return mapExpenseLine(body as Record<string, unknown>);
}

export async function deleteExpenseInvoice(expenseId: string, fileId: string) {
  const raw = await api<Record<string, unknown>>(
    `/expenses/${expenseId}/invoices/${fileId}`,
    { method: "DELETE" }
  );
  return mapExpenseLine(raw);
}

/** After sync, upload queued photos and merge server state into local lines. */
export async function uploadPendingInvoices(
  before: ExpenseLine[],
  synced: ExpenseLine[]
): Promise<ExpenseLine[]> {
  const result: ExpenseLine[] = [];

  for (let i = 0; i < synced.length; i++) {
    const serverLine = { ...synced[i] };
    const local =
      before.find((b) => b.id && b.id === serverLine.id) ??
      before[i] ??
      before.find(
        (b) =>
          !b.id &&
          b.description === serverLine.description &&
          b.amount === serverLine.amount
      );

    const pending = local?.pendingPhotos ?? [];
    let line = serverLine;

    if (line.id && pending.length > 0) {
      for (const photo of pending) {
        line = await uploadExpenseInvoice(line.id!, photo);
      }
    }

    result.push({ ...line, pendingPhotos: [] });
  }

  return result;
}
