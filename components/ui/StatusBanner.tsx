import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/lib/theme";

type Variant = "info" | "success" | "warning" | "error";

const palette: Record<Variant, { bg: string; text: string }> = {
  info: { bg: "#eff6ff", text: "#1e3a5f" },
  success: { bg: "#dcfce7", text: "#166534" },
  warning: { bg: "#fef3c7", text: "#92400e" },
  error: { bg: "#fee2e2", text: "#991b1b" },
};

export function StatusBanner({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  const p = palette[variant];
  return (
    <View style={[styles.wrap, { backgroundColor: p.bg }]}>
      <Text style={[styles.text, { color: p.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
  },
  text: { fontSize: 14, fontWeight: "500", textAlign: "center", lineHeight: 20 },
});
