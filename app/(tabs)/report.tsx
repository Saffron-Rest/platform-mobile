import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ReportContextBanner } from "@/components/report/ReportContextBanner";
import { ReportForm } from "@/components/report/ReportForm";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { api } from "@/lib/api";
import { entryToFormData } from "@/lib/calc";
import { todayLocalIso, reportDateRelativeLabel } from "@/lib/dates";
import {
  applyEntryToState,
  loadExpenses,
  loadSuggestedOpening,
  loadTodayEntry,
  loadTodaySchedule,
  saveEntry,
  submitEntry,
  syncExpenses,
  uploadPendingInvoices,
} from "@/lib/entries";
import { colors, spacing } from "@/lib/theme";
import type { DailyEntry, EntryFormData, ExpenseLine, OpeningHint, Platforms } from "@/lib/types";
import { emptyEntryForm, emptyExpenseLine } from "@/lib/types";

export default function ReportScreen() {
  const reportDate = todayLocalIso();
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [form, setForm] = useState<EntryFormData>(emptyEntryForm());
  const [expenses, setExpenses] = useState<ExpenseLine[]>([emptyExpenseLine()]);
  const [openingHint, setOpeningHint] = useState<OpeningHint | null>(null);
  const [platforms, setPlatforms] = useState<Platforms>({
    wolt: true,
    bolt: true,
    uberEats: true,
    glovo: true,
    other: true,
  });
  const [closingOnly, setClosingOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [scheduleOff, setScheduleOff] = useState(false);
  const [hoursLabel, setHoursLabel] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    if (!silent) {
      setMessage("");
      setMessageIsError(false);
    }
    try {
      const [e, suggested, settings, schedule] = await Promise.all([
        loadTodayEntry(reportDate),
        loadSuggestedOpening(reportDate),
        api<{ platforms: Platforms }>("/settings"),
        loadTodaySchedule(reportDate),
      ]);
      setPlatforms(settings.platforms);
      setScheduleOff(schedule != null && !schedule.working);
      setHoursLabel(schedule?.working ? schedule.hoursLabel : null);
      setOpeningHint(suggested.hint);
      const state = applyEntryToState(e, suggested.form, schedule);
      setEntry(e);
      setForm(state.form);
      setClosingOnly(state.closingOnly);
      if (e?.id) {
        const lines = state.expenses.length
          ? state.expenses
          : await loadExpenses(e.id);
        setExpenses(lines.length ? lines : [emptyExpenseLine()]);
      } else {
        setExpenses([emptyExpenseLine()]);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load");
      setMessageIsError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reportDate]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const locked = entry?.status === "LOCKED";
  const isNew = !entry;

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setMessageIsError(false);
    try {
      let saved = await saveEntry(form, entry, reportDate);
      if (!closingOnly) {
        const before = [...expenses];
        const synced = await syncExpenses(saved.id, expenses);
        const withPhotos = await uploadPendingInvoices(before, synced);
        setExpenses(withPhotos.length ? withPhotos : [emptyExpenseLine()]);
      }
      saved = await api<DailyEntry>(`/entries/${saved.id}`);
      setEntry(saved);
      setForm(entryToFormData(saved));
      if (!closingOnly) {
        const lines = await loadExpenses(saved.id);
        setExpenses(lines.length ? lines : [emptyExpenseLine()]);
      }
      setMessage(`Draft saved · ${reportDateRelativeLabel(reportDate)}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage("");
    setMessageIsError(false);
    try {
      const saved = await saveEntry(form, entry, reportDate);
      if (!closingOnly) {
        const before = [...expenses];
        const synced = await syncExpenses(saved.id, expenses);
        const withPhotos = await uploadPendingInvoices(before, synced);
        setExpenses(withPhotos.length ? withPhotos : [emptyExpenseLine()]);
      }
      const updated = await submitEntry(saved.id);
      setEntry(updated);
      setForm(entryToFormData(updated));
      if (!closingOnly) {
        const lines = await loadExpenses(updated.id);
        setExpenses(lines.length ? lines : [emptyExpenseLine()]);
      }
      setMessage(`Submitted and locked · ${reportDateRelativeLabel(reportDate)}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Submit failed");
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.saffron} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ReportContextBanner
        date={reportDate}
        status={entry?.status}
        isNew={isNew}
        shiftLabel={hoursLabel}
      />

      {scheduleOff && !entry && (
        <StatusBanner variant="warning">
          Not scheduled today — only open a report if you are working.
        </StatusBanner>
      )}

      {isNew && !locked && (
        <StatusBanner variant="info">
          No report saved yet. Work through each section, save a draft, then submit when ready.
        </StatusBanner>
      )}

      {message ? (
        <StatusBanner variant={messageIsError ? "error" : "success"}>
          {message}
        </StatusBanner>
      ) : null}

      {locked && (
        <StatusBanner variant="warning">
          Submitted and locked. After your manager unlocks it, pull down to refresh this screen, then
          save and submit again.
        </StatusBanner>
      )}

      <ReportForm
        form={form}
        expenses={expenses}
        platforms={platforms}
        closingOnly={closingOnly}
        locked={locked}
        saving={saving}
        openingHint={openingHint}
        refreshing={refreshing}
        onRefresh={() => load(true)}
        onChange={setForm}
        onExpensesChange={setExpenses}
        onSave={handleSave}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.cream,
  },
});
