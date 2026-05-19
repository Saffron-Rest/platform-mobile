import { StyleSheet, Text } from "react-native";
import { fmt } from "@/lib/calc";
import { colors } from "@/lib/theme";
import type { OpeningHint } from "@/lib/types";

export function OpeningHintText({ hint }: { hint: OpeningHint }) {
  if (hint.handoverPending && hint.handoverCashierName) {
    return (
      <Text style={styles.warn}>
        {hint.handoverCashierName} has not finished their count yet. Using the last locked
        restaurant total until they save.
      </Text>
    );
  }
  if (hint.source === "SAME_DAY_HANDOVER") {
    const who = hint.handoverCashierName ? `${hint.handoverCashierName}'s ` : "";
    return (
      <Text style={styles.muted}>
        Drawer from {who}today&apos;s count: {fmt(hint.amount)}
      </Text>
    );
  }
  const who = hint.handoverCashierName ? ` (${hint.handoverCashierName})` : "";
  return (
    <Text style={styles.muted}>
      Last close {hint.fromDate}
      {who}: {fmt(hint.amount)}
    </Text>
  );
}

const styles = StyleSheet.create({
  warn: { fontSize: 12, color: "#b45309", lineHeight: 18, marginTop: 6 },
  muted: { fontSize: 12, color: colors.muted, lineHeight: 18, marginTop: 6 },
});
