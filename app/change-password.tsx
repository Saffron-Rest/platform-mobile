import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { colors, spacing } from "@/lib/theme";

export default function ChangePasswordScreen() {
  const { changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <View style={styles.inner}>
        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.sub}>You must choose a new password before using the app.</Text>

        <View style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.label}>Current password (temporary)</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            autoComplete="password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            autoComplete="new-password"
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Text style={styles.label}>Confirm new password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            autoComplete="new-password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Button
            title="Update password"
            loading={loading}
            disabled={!currentPassword || !newPassword || !confirmPassword}
            onPress={handleSubmit}
          />
          <Button title="Sign out" variant="secondary" onPress={logout} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  inner: { flex: 1, justifyContent: "center", padding: spacing.lg },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.saffronDark,
    marginBottom: spacing.xs,
  },
  sub: { fontSize: 14, color: colors.muted, marginBottom: spacing.lg },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  error: { color: colors.danger, marginBottom: spacing.sm },
});
