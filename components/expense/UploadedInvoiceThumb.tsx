import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { InvoicePreviewModal } from "./InvoicePreviewModal";
import { fetchInvoiceToCache, isImageFilename } from "@/lib/files";
import { colors } from "@/lib/theme";
import type { ExpenseInvoice } from "@/lib/types";

type Props = {
  invoice: ExpenseInvoice;
  locked: boolean;
  onRemove?: () => void;
};

export function UploadedInvoiceThumb({ invoice, locked, onRemove }: Props) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const isImage = isImageFilename(invoice.filename);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const uri = await fetchInvoiceToCache(invoice.id, invoice.filename);
      setLocalUri(uri);
    } catch {
      setLocalUri(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [invoice.id, invoice.filename]);

  useEffect(() => {
    load();
  }, [load]);

  const openPreview = () => {
    if (!localUri && !loading) {
      load().then(() => setPreviewOpen(true));
    } else {
      setPreviewOpen(true);
    }
  };

  return (
    <>
      <View style={styles.wrap}>
        <Pressable onPress={openPreview} style={styles.press} disabled={loading && !localUri}>
          {loading && !localUri ? (
            <View style={styles.fileThumb}>
              <ActivityIndicator color={colors.saffron} />
            </View>
          ) : localUri && isImage ? (
            <Image source={{ uri: localUri }} style={styles.thumb} />
          ) : (
            <View style={styles.fileThumb}>
              <Text style={styles.fileIcon}>{loadError ? "⚠️" : "📄"}</Text>
              <Text style={styles.fileName} numberOfLines={2}>
                {loadError ? "Tap to retry" : invoice.filename}
              </Text>
            </View>
          )}
          {(localUri || !loadError) && !loading && (
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>View</Text>
            </View>
          )}
        </Pressable>
        {!locked && onRemove && (
          <Pressable style={styles.remove} onPress={onRemove}>
            <Text style={styles.removeText}>×</Text>
          </Pressable>
        )}
      </View>
      <InvoicePreviewModal
        visible={previewOpen}
        localUri={localUri}
        filename={invoice.filename}
        isImage={isImage}
        loading={loading && previewOpen && !localUri}
        onRetry={load}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { marginRight: 10, position: "relative" },
  press: { position: "relative" },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.cream },
  fileThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  fileIcon: { fontSize: 22 },
  fileName: { fontSize: 9, textAlign: "center", color: colors.muted },
  tapHint: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  tapHintText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  remove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: { color: "#fff", fontSize: 16, fontWeight: "700", lineHeight: 18 },
});
