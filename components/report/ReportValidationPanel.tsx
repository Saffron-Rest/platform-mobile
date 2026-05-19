import { StyleSheet, Text, View } from "react-native";
import type { ValidationIssue } from "@/lib/reportProgress";
import { colors, spacing } from "@/lib/theme";

type Props = {
  issues: ValidationIssue[];
  ready: boolean;
};

export function ReportValidationPanel({ issues, ready }: Props) {
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  if (ready && warnings.length === 0) {
    return (
      <View style={[styles.box, styles.ready]}>
        <Text style={styles.readyTitle}>Ready to submit</Text>
        <Text style={styles.readySub}>Review totals, then submit and lock.</Text>
      </View>
    );
  }

  if (errors.length === 0 && warnings.length === 0 && !ready) return null;

  return (
    <View style={styles.wrap}>
      {errors.length > 0 && (
        <View style={[styles.box, styles.errorBox]}>
          <Text style={styles.boxTitle}>Before you submit ({errors.length})</Text>
          {errors.map((e) => (
            <Text key={e.id} style={styles.item}>
              • {e.message}
            </Text>
          ))}
        </View>
      )}
      {warnings.length > 0 && (
        <View style={[styles.box, styles.warnBox]}>
          <Text style={styles.boxTitleWarn}>Review ({warnings.length})</Text>
          {warnings.map((w) => (
            <Text key={w.id} style={styles.itemWarn}>
              • {w.message}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
  box: { padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  ready: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  readyTitle: { fontSize: 14, fontWeight: "700", color: "#065f46" },
  readySub: { fontSize: 12, color: "#047857", marginTop: 2 },
  errorBox: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  warnBox: { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
  boxTitle: { fontSize: 13, fontWeight: "700", color: colors.danger, marginBottom: 6 },
  boxTitleWarn: { fontSize: 13, fontWeight: "700", color: "#92400e", marginBottom: 6 },
  item: { fontSize: 13, color: "#991b1b", lineHeight: 20, marginTop: 2 },
  itemWarn: { fontSize: 13, color: "#78350f", lineHeight: 20, marginTop: 2 },
});
