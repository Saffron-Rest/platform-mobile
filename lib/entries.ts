import { api, ApiError } from "./api";
import { entryToFormData } from "./calc";
import { todayLocalIso } from "./dates";
import {
  loadExpenses,
  syncExpenses,
  uploadPendingInvoices,
} from "./expenses";
import type {
  DailyEntry,
  EntryFormData,
  ExpenseLine,
  OpeningHint,
  WorkSchedule,
} from "./types";
import { emptyEntryForm } from "./types";

export { loadExpenses, syncExpenses, uploadPendingInvoices };

function isDailyEntry(v: unknown): v is DailyEntry {
  return (
    v !== null &&
    typeof v === "object" &&
    typeof (v as DailyEntry).id === "string" &&
    (v as DailyEntry).id.length > 0
  );
}

export async function loadTodayEntry(date = todayLocalIso()): Promise<DailyEntry | null> {
  let e = await api<DailyEntry | null>(`/entries/today?date=${encodeURIComponent(date)}`);
  if (!isDailyEntry(e)) {
    const list = await api<DailyEntry[]>(
      `/entries?from=${encodeURIComponent(date)}&to=${encodeURIComponent(date)}`
    );
    e = Array.isArray(list) && isDailyEntry(list[0]) ? list[0] : null;
  }
  if (e?.id) {
    try {
      const detail = await api<DailyEntry>(`/entries/${e.id}`);
      if (isDailyEntry(detail)) e = detail;
    } catch {
      /* use list/today payload */
    }
  }
  return isDailyEntry(e) ? e : null;
}

export async function loadTodaySchedule(date = todayLocalIso()): Promise<WorkSchedule | null> {
  try {
    return await api<WorkSchedule>(`/shifts/today?date=${encodeURIComponent(date)}`);
  } catch {
    return null;
  }
}

export type SuggestedOpeningResult = {
  form: EntryFormData;
  hint: OpeningHint | null;
};

export async function loadSuggestedOpening(date: string): Promise<SuggestedOpeningResult> {
  try {
    const s = await api<{
      openingBalance: number;
      previousDate?: string | null;
      source?: OpeningHint["source"];
      handoverCashierName?: string | null;
      handoverPending?: boolean;
    }>(`/entries/suggested-opening?date=${encodeURIComponent(date)}`);
    const opening = Number(s?.openingBalance) || 0;
    const hint: OpeningHint | null =
      s.previousDate != null || s.handoverPending
        ? {
            amount: opening,
            fromDate: s.previousDate ?? date,
            source: s.source,
            handoverCashierName: s.handoverCashierName,
            handoverPending: s.handoverPending,
          }
        : null;
    return { form: { ...emptyEntryForm(), openingBalance: opening }, hint };
  } catch {
    return { form: emptyEntryForm(), hint: null };
  }
}

export async function saveEntry(
  form: EntryFormData,
  entry: DailyEntry | null,
  date = todayLocalIso()
): Promise<DailyEntry> {
  const body = { ...form, date };
  let entryId = entry?.id;

  if (entryId) {
    try {
      await api(`/entries/${entryId}`);
    } catch {
      entryId = undefined;
    }
  }
  if (!entryId) {
    const existing = await loadTodayEntry(date);
    entryId = existing?.id;
  }

  if (entryId) {
    return api<DailyEntry>(`/entries/${entryId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  try {
    const created = await api<DailyEntry>("/entries", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!isDailyEntry(created)) {
      throw new Error("Server did not return a report");
    }
    return created;
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      const conflictId = err.entryId ?? (await loadTodayEntry(date))?.id;
      if (conflictId) {
        return api<DailyEntry>(`/entries/${conflictId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }
    }
    const existing = await loadTodayEntry(date);
    if (existing?.id) {
      return api<DailyEntry>(`/entries/${existing.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    }
    throw err instanceof Error ? err : new Error("Could not create report");
  }
}

export async function submitEntry(id: string): Promise<DailyEntry> {
  return api<DailyEntry>(`/entries/${id}/submit`, { method: "POST" });
}

export function applyEntryToState(
  e: DailyEntry | null,
  suggested: EntryFormData,
  schedule?: WorkSchedule | null
) {
  if (!e) {
    return {
      form: suggested,
      expenses: [] as ExpenseLine[],
      closingOnly: Boolean(schedule?.closingOnly || schedule?.shiftType === "CLOSING"),
      shiftType: schedule?.shiftType ?? ("FULL" as const),
    };
  }
  const form = entryToFormData(e);
  return {
    form,
    expenses: e.expenses ?? [],
    closingOnly: Boolean(e.closingOnly || e.shiftType === "CLOSING" || schedule?.closingOnly),
    shiftType: e.shiftType ?? schedule?.shiftType ?? "FULL",
  };
}
