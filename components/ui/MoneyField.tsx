import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, spacing } from "@/lib/theme";

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  dark?: boolean;
};

/** Accept `12`, `12.5`, `12,5`, and partial input like `12.` while typing.
 *  Local `raw` string keeps what the user typed so the decimal separator is
 *  never swallowed by a re-render. */
export function MoneyField({ label, value, onChange, disabled, dark }: Props) {
  const focusedRef = useRef(false);
  const [raw, setRaw] = useState<string>(() => (value === 0 ? "" : String(value)));

  useEffect(() => {
    if (focusedRef.current) return;
    setRaw(value === 0 ? "" : String(value));
  }, [value]);

  const handleChange = (t: string) => {
    const cleaned = t.replace(/[^\d.,]/g, "");
    setRaw(cleaned);

    if (cleaned === "" || cleaned === "." || cleaned === ",") {
      if (value !== 0) onChange(0);
      return;
    }
    if (/[.,]$/.test(cleaned)) return;

    const n = parseFloat(cleaned.replace(",", "."));
    if (!Number.isFinite(n)) return;
    if (n !== value) onChange(n);
  };

  const handleBlur = () => {
    focusedRef.current = false;
    const cleaned = raw.replace(/[^\d.,]/g, "").replace(",", ".");
    const n = cleaned === "" || cleaned === "." ? 0 : parseFloat(cleaned);
    const committed = Number.isFinite(n) ? n : 0;
    if (committed !== value) onChange(committed);
    setRaw(committed === 0 ? "" : String(committed));
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>
      <TextInput
        style={[styles.input, dark && styles.inputDark, disabled && styles.disabled]}
        value={raw}
        onChangeText={handleChange}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={handleBlur}
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
