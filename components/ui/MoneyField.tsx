import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, spacing } from "@/lib/theme";

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  dark?: boolean;
};

export function MoneyField({ label, value, onChange, disabled, dark }: Props) {
  const text = value === 0 ? "" : String(value);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>
      <TextInput
        style={[styles.input, dark && styles.inputDark, disabled && styles.disabled]}
        value={text}
        onChangeText={(t) => {
          const cleaned = t.replace(",", ".").replace(/[^\d.]/g, "");
          const n = cleaned === "" || cleaned === "." ? 0 : parseFloat(cleaned);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={dark ? "rgba(255,255,255,0.4)" : colors.muted}
        editable={!disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  labelDark: { color: "rgba(255,255,255,0.7)" },
  input: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink,
  },
  inputDark: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.2)",
    color: "#fff",
  },
  disabled: { opacity: 0.6 },
});
