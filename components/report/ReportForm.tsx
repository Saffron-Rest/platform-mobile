import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExpenseLineEditor } from "@/components/expense/ExpenseLineEditor";
import { OpeningHintText } from "@/components/report/OpeningHintText";
import { ReportStepper } from "@/components/report/ReportStepper";
import { ReportValidationPanel } from "@/components/report/ReportValidationPanel";
import { MoneyField } from "@/components/ui/MoneyField";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fmt } from "@/lib/calc";
import {
  buildReportSteps,
  getReportValidationIssues,
  reportReadyToSubmit,
  reportSummary,
} from "@/lib/reportProgress";
import { colors, spacing } from "@/lib/theme";
import type {
  EntryFormData,
  ExpenseLine,
  OpeningHint,
  Platforms,
} from "@/lib/types";
import { emptyExpenseLine } from "@/lib/types";

type Props = {
  form: EntryFormData;
  expenses: ExpenseLine[];
  platforms: Platforms;
  closingOnly: boolean;
  locked: boolean;
  saving: boolean;
  openingHint?: OpeningHint | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onChange: (f: EntryFormData) => void;
  onExpensesChange: (e: ExpenseLine[]) => void;
  onSave: () => void;
  onSubmit: () => void;
};

export function ReportForm({
  form,
  expenses,
  platforms,
  closingOnly,
  locked,
  saving,
  openingHint,
  refreshing,
  onRefresh,
  onChange,
  onExpensesChange,
  onSave,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets();
  const [showRefunds, setShowRefunds] = useState(false);
  const [showPayouts, setShowPayouts] = useState(false);

  const set = <K extends keyof EntryFormData>(key: K, value: EntryFormData[K]) =>
    onChange({ ...form, [key]: value });

  const summary = useMemo(
    () => reportSummary(form, expenses, closingOnly),
    [form, expenses, closingOnly]
  );
  const steps = useMemo(
    () => buildReportSteps(form, expenses, closingOnly),
    [form, expenses, closingOnly]
  );
  const issues = useMemo(
    () => getReportValidationIssues(form, expenses, closingOnly),
    [form, expenses, closingOnly]
  );
  const canSubmit = reportReadyToSubmit(form, expenses, closingOnly);

  const updateExpense = (i: number, patch: Partial<ExpenseLine>) => {
    const next = [...expenses];
    next[i] = { ...next[i], ...patch };
    onExpensesChange(next);
  };

  const confirmSubmit = () => {
    if (!canSubmit) {
      const blocking = issues.filter((i) => i.level === "error");
      Alert.alert(
        "Not ready yet",
        blocking.map((i) => `• ${i.message}`).join("\n") || "Complete all required sections."
      );
      return;
    }
    const note =
      Math.abs(summary.difference) > 0.01
        ? `\n\nCash difference: ${fmt(summary.difference)}`
        : "\n\nCash is balanced.";
    Alert.alert(
      "Submit & lock?",
      `You cannot edit after submit.${note}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", style: "destructive", onPress: onSubmit },
      ]
    );
  };

  const footerPad = 88 + insets.bottom;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: footerPad }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.saffron}
            />
          ) : undefined
        }
      >
        {closingOnly && (
          <Card style={styles.infoCard}>
            <Text style={styles.infoText}>
              Closing shift — opening cash and final count only.
            </Text>
          </Card>
        )}

        {!locked && <ReportStepper steps={steps} />}

        <View style={styles.summaryBar}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Expected</Text>
            <Text style={styles.summaryValue}>{fmt(summary.expected)}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Counted</Text>
            <Text style={styles.summaryValue}>
              {summary.actual > 0 ? fmt(summary.actual) : "—"}
            </Text>
          </View>
          <View
            style={[
              styles.summaryCell,
              summary.difference < -0.01 && styles.summaryBad,
              summary.difference > 0.01 && styles.summaryGood,
            ]}
          >
            <Text style={styles.summaryLabel}>Diff</Text>
            <Text style={styles.summaryValue}>{fmt(summary.difference)}</Text>
          </View>
        </View>

        {!locked && (
          <ReportValidationPanel issues={issues} ready={canSubmit} />
        )}

        <Card>
          <Text style={styles.sectionTitle}>Opening</Text>
          {openingHint && !locked ? <OpeningHintText hint={openingHint} /> : null}
          <MoneyField
            label="Opening balance"
            value={form.openingBalance}
            onChange={(v) => set("openingBalance", v)}
            disabled={locked}
          />
        </Card>

        {!closingOnly && (
          <>
            <Card>
              <Text style={styles.sectionTitle}>Sales</Text>
              <Text style={styles.sectionSub}>Total {fmt(summary.sales)}</Text>
              <MoneyField
                label="Cash sales"
                value={form.cashSales}
                onChange={(v) => set("cashSales", v)}
                disabled={locked}
              />
              <MoneyField
                label="Card sales"
                value={form.cardSales}
                onChange={(v) => set("cardSales", v)}
                disabled={locked}
              />
              {platforms.wolt && (
                <MoneyField
                  label="Wolt"
                  value={form.woltSales}
                  onChange={(v) => set("woltSales", v)}
                  disabled={locked}
                />
              )}
              {platforms.bolt && (
                <MoneyField
                  label="Bolt Food"
                  value={form.boltSales}
                  onChange={(v) => set("boltSales", v)}
                  disabled={locked}
                />
              )}
              {platforms.uberEats && (
                <MoneyField
                  label="Uber Eats"
                  value={form.uberEatsSales}
                  onChange={(v) => set("uberEatsSales", v)}
                  disabled={locked}
                />
              )}
              {platforms.glovo && (
                <MoneyField
                  label="Glovo"
                  value={form.glovoSales}
                  onChange={(v) => set("glovoSales", v)}
                  disabled={locked}
                />
              )}
              {platforms.other && (
                <MoneyField
                  label="Other platforms"
                  value={form.otherPlatformSales}
                  onChange={(v) => set("otherPlatformSales", v)}
                  disabled={locked}
                />
              )}
            </Card>

            <Card>
              <Text
                style={styles.link}
                onPress={() => setShowRefunds(!showRefunds)}
              >
                {showRefunds ? "▼" : "▶"} Returns & refunds
              </Text>
              {showRefunds && (
                <>
                  <MoneyField
                    label="Cash refunds"
                    value={form.cashRefunds}
                    onChange={(v) => set("cashRefunds", v)}
                    disabled={locked}
                  />
                  <MoneyField
                    label="Card refunds"
                    value={form.cardRefunds}
                    onChange={(v) => set("cardRefunds", v)}
                    disabled={locked}
                  />
                  <MoneyField
                    label="Platform refunds"
                    value={form.platformRefunds}
                    onChange={(v) => set("platformRefunds", v)}
                    disabled={locked}
                  />
                </>
              )}
            </Card>

            <Card>
              <Text style={styles.link} onPress={() => setShowPayouts(!showPayouts)}>
                {showPayouts ? "▼" : "▶"} Payouts & deposits
              </Text>
              {showPayouts && (
                <>
                  <MoneyField
                    label="Bank deposit"
                    value={form.bankDeposit}
                    onChange={(v) => set("bankDeposit", v)}
                    disabled={locked}
                  />
                  <MoneyField
                    label="Cash withdrawal"
                    value={form.cashWithdrawal}
                    onChange={(v) => set("cashWithdrawal", v)}
                    disabled={locked}
                  />
                  <MoneyField
                    label="Owner withdrawal"
                    value={form.ownerWithdrawal}
                    onChange={(v) => set("ownerWithdrawal", v)}
                    disabled={locked}
                  />
                </>
              )}
            </Card>

            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Expenses</Text>
                {!locked && (
                  <Text
                    style={styles.link}
                    onPress={() => onExpensesChange([...expenses, emptyExpenseLine()])}
                  >
                    + Add
                  </Text>
                )}
              </View>
              {expenses.map((line, i) => (
                <ExpenseLineEditor
                  key={line.id ?? `e-${i}`}
                  line={line}
                  index={i}
                  locked={locked}
                  canRemove={expenses.length > 1}
                  onChange={(patch) => updateExpense(i, patch)}
                  onRemove={() => onExpensesChange(expenses.filter((_, j) => j !== i))}
                />
              ))}
            </Card>
          </>
        )}

        <View style={styles.closingBlock}>
          <Text style={styles.closingTitle}>Closing — count the drawer</Text>
          <Text style={styles.closingSub}>Expected: {fmt(summary.expected)}</Text>
          <MoneyField
            label="Actual cash counted"
            value={form.actualCashCounted}
            onChange={(v) => set("actualCashCounted", v)}
            disabled={locked}
            dark
          />
          <View
            style={[
              styles.diffBox,
              summary.difference < -0.01 && styles.diffBad,
              summary.difference > 0.01 && styles.diffGood,
            ]}
          >
            <Text style={styles.diffLabel}>Difference</Text>
            <Text style={styles.diffValue}>{fmt(summary.difference)}</Text>
          </View>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notes}
            multiline
            numberOfLines={3}
            placeholder="Anything unusual today…"
            value={form.notes}
            onChangeText={(t) => set("notes", t)}
            editable={!locked}
          />
        </Card>
      </ScrollView>

      {!locked && (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <Button
            title={saving ? "Saving…" : "Save draft"}
            variant="secondary"
            loading={saving}
            onPress={onSave}
            style={styles.footerBtn}
          />
          <Button
            title="Submit & lock"
            loading={saving}
            disabled={!canSubmit}
            onPress={confirmSubmit}
            style={styles.footerBtn}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingTop: spacing.xs },
  infoCard: { marginHorizontal: spacing.md, backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  infoText: { color: "#1e3a5f", lineHeight: 20, fontSize: 14 },
  summaryBar: {
    flexDirection: "row",
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  summaryCell: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  summaryBad: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  summaryGood: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  summaryLabel: { fontSize: 10, fontWeight: "600", color: colors.muted, textTransform: "uppercase" },
  summaryValue: { fontSize: 14, fontWeight: "700", color: colors.ink, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.saffronDark, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: colors.muted, marginBottom: spacing.sm },
  link: { fontSize: 15, fontWeight: "600", color: colors.saffron, marginBottom: spacing.sm },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closingBlock: {
    backgroundColor: colors.ink,
    borderRadius: 16,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  closingTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  closingSub: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginVertical: 8 },
  diffBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  diffBad: { backgroundColor: "rgba(185,28,28,0.3)" },
  diffGood: { backgroundColor: "rgba(21,128,61,0.3)" },
  diffLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, textTransform: "uppercase" },
  diffValue: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 4 },
  notes: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontSize: 16,
    textAlignVertical: "top",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: "rgba(250, 246, 240, 0.96)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerBtn: { flex: 1 },
});
