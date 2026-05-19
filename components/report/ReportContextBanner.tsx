import { StyleSheet, Text, View } from "react-native";
import { formatReportDateLong, reportDateRelativeLabel } from "@/lib/dates";
import { colors, spacing } from "@/lib/theme";

type Props = {
  date: string;
  status?: string | null;
  isNew?: boolean;
  shiftLabel?: string | null;
};

export function ReportContextBanner({ date, status, isNew, shiftLabel }: Props) {
  const statusUpper = status?.toUpperCase();
  const showDraft = statusUpper === "DRAFT";
  const showLocked = statusUpper === "LOCKED";

  return (
    <View style={styles.wrap} accessibilityRole="header">
      <Text style={styles.label}>Report for</Text>
      <Text style={styles.date}>{formatReportDateLong(date)}</Text>
      <View style={styles.row}>
        <Text style={styles.chip}>{reportDateRelativeLabel(date)}</Text>
        {isNew && !status && (
          <Text style={[styles.pill, styles.pillNew]}>NEW</Text>
        )}
        {showDraft && <Text style={[styles.pill, styles.pillDraft]}>DRAFT</Text>}
        {showLocked && <Text style={[styles.pill, styles.pillLocked]}>LOCKED</Text>}
      </View>
      {shiftLabel ? (
        <Text style={styles.shift}>Shift: {shiftLabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(196, 92, 38, 0.28)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.saffronDark,
  },
  date: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 4,
    lineHeight: 26,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(196, 92, 38, 0.14)",
    color: colors.saffronDark,
  },
  pill: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  pillNew: { backgroundColor: "#dbeafe", color: "#1e40af" },
  pillDraft: { backgroundColor: "#fef3c7", color: "#92400e" },
  pillLocked: { backgroundColor: "#dcfce7", color: "#166534" },
  shift: { fontSize: 13, color: colors.muted, marginTop: 8 },
});
