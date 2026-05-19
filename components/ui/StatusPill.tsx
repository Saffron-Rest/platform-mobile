import { StyleSheet, Text, View } from "react-native";

const stylesByStatus: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#fef3c7", text: "#92400e" },
  LOCKED: { bg: "#dcfce7", text: "#166534" },
  NEW: { bg: "#dbeafe", text: "#1e40af" },
};

export function StatusPill({ status }: { status: string }) {
  const key = status.toUpperCase();
  const s = stylesByStatus[key] ?? { bg: "#f3f4f6", text: "#374151" };
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.text }]}>{key}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  text: { fontSize: 12, fontWeight: "700" },
});
