import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors } from "@/lib/theme";

type Props = PressableProps & {
  title: string;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

export function Button({
  title,
  variant = "primary",
  loading,
  disabled,
  style,
  ...rest
}: Props) {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";

  return (
    <Pressable
      style={({ pressed }) => {
        const base: StyleProp<ViewStyle> = [
          styles.base,
          isPrimary && styles.primary,
          isSecondary && styles.secondary,
          variant === "ghost" && styles.ghost,
          (disabled || loading) && styles.disabled,
          pressed && !disabled && styles.pressed,
        ];
        return style ? [...base, style as ViewStyle] : base;
      }}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#fff" : colors.saffron} />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary && styles.textPrimary,
            isSecondary && styles.textSecondary,
            variant === "ghost" && styles.textGhost,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.saffron },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.88 },
  text: { fontSize: 16, fontWeight: "600" },
  textPrimary: { color: "#fff" },
  textSecondary: { color: colors.ink },
  textGhost: { color: colors.saffron },
});
