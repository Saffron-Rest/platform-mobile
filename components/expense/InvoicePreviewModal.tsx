import {
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Linking } from "react-native";
import { colors, spacing } from "@/lib/theme";

type Props = {
  visible: boolean;
  localUri: string | null;
  filename: string;
  isImage: boolean;
  loading?: boolean;
  onRetry: () => void;
  onClose: () => void;
};

export function InvoicePreviewModal({
  visible,
  localUri,
  filename,
  isImage,
  loading,
  onRetry,
  onClose,
}: Props) {
  const openExternally = () => {
    if (localUri) {
      Linking.openURL(localUri).catch(() => {});
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {filename}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.saffron} />
              <Text style={styles.muted}>Loading receipt…</Text>
            </View>
          ) : localUri && isImage ? (
            <Image source={{ uri: localUri }} style={styles.image} resizeMode="contain" />
          ) : localUri ? (
            <View style={styles.centered}>
              <Text style={styles.muted}>Preview not available for this file type.</Text>
              <Pressable style={styles.openBtn} onPress={openExternally}>
                <Text style={styles.openBtnText}>Open / share file</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={styles.muted}>Could not load this receipt.</Text>
              <Pressable style={styles.openBtn} onPress={onRetry}>
                <Text style={styles.openBtnText}>Try again</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: spacing.md,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  title: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.ink },
  close: { fontSize: 15, fontWeight: "600", color: colors.saffron },
  image: { width: "100%", height: 420, backgroundColor: colors.cream },
  centered: {
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
    minHeight: 200,
    justifyContent: "center",
  },
  openBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.saffron,
  },
  openBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  muted: { textAlign: "center", color: colors.muted, fontSize: 14 },
});
