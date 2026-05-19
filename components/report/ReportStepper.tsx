import { StyleSheet, Text, View } from "react-native";
import type { ReportStep } from "@/lib/reportProgress";
import { colors, spacing } from "@/lib/theme";

export function ReportStepper({ steps }: { steps: ReportStep[] }) {
  const done = steps.filter((s) => s.done).length;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.count}>
          {done}/{steps.length}
        </Text>
      </View>
      <View style={styles.trackRow}>
        {steps.map((step) => (
          <View key={step.id} style={styles.trackCell}>
            <View style={[styles.track, step.done && styles.trackDone]} />
          </View>
        ))}
      </View>
      <View style={styles.labelRow}>
        {steps.map((step) => (
          <View key={step.id} style={styles.labelCell}>
            <Text
              style={[styles.stepLabel, step.done && styles.stepLabelDone]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
            {!step.done && step.hint ? (
              <Text style={styles.hint} numberOfLines={2}>
                {step.hint}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: { fontSize: 13, fontWeight: "600", color: colors.muted },
  count: { fontSize: 13, fontWeight: "700", color: colors.ink },
  trackRow: { flexDirection: "row", gap: 4 },
  trackCell: { flex: 1 },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  trackDone: { backgroundColor: colors.success },
  labelRow: { flexDirection: "row", marginTop: 8, gap: 4 },
  labelCell: { flex: 1, minWidth: 0 },
  stepLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    color: colors.muted,
  },
  stepLabelDone: { color: colors.success },
  hint: {
    fontSize: 9,
    color: colors.danger,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 12,
  },
});
