import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MoneyField } from "@/components/ui/MoneyField";
import { UploadedInvoiceThumb } from "@/components/expense/UploadedInvoiceThumb";
import { deleteExpenseInvoice } from "@/lib/expenses";
import { colors, spacing } from "@/lib/theme";
import type { ExpenseLine, PaymentSource } from "@/lib/types";

const CATEGORIES = [
  { value: "SUPPLIER", label: "Supplier" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "STAFF_MEALS", label: "Staff meals" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "PETTY_CASH", label: "Petty cash" },
  { value: "OTHER", label: "Other" },
];

type Props = {
  line: ExpenseLine;
  index: number;
  locked: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<ExpenseLine>) => void;
  onRemove: () => void;
};

export function ExpenseLineEditor({
  line,
  index,
  locked,
  canRemove,
  onChange,
  onRemove,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const invoices = line.invoices ?? (line.invoice ? [line.invoice] : []);
  const pending = line.pendingPhotos ?? [];

  const pickPhoto = async (useCamera: boolean) => {
    if (locked) return;
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow camera or photos to attach receipts.");
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: false })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.85,
          allowsMultipleSelection: true,
          selectionLimit: 5,
        });

    if (result.canceled || !result.assets?.length) return;

    const added = result.assets.map((a) => ({
      uri: a.uri,
      name: a.fileName ?? `receipt-${Date.now()}.jpg`,
      mimeType: a.mimeType ?? "image/jpeg",
    }));
    onChange({ pendingPhotos: [...pending, ...added] });
  };

  const removePending = (uri: string) => {
    onChange({ pendingPhotos: pending.filter((p) => p.uri !== uri) });
  };

  const removeUploaded = async (fileId: string) => {
    if (!line.id || locked) return;
    Alert.alert("Remove photo?", "This deletes the uploaded invoice file.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setUploading(true);
          try {
            const updated = await deleteExpenseInvoice(line.id!, fileId);
            onChange({
              invoices: updated.invoices,
              invoice: updated.invoice,
              pendingPhotos: line.pendingPhotos,
            });
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Could not remove");
          } finally {
            setUploading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.block}>
      <Text style={styles.lineTitle}>Expense {index + 1}</Text>

      <View style={styles.chipRow}>
        {(["CASH", "CARD"] as PaymentSource[]).map((src) => (
          <Pressable
            key={src}
            style={[styles.chip, line.paymentSource === src && styles.chipOn]}
            onPress={() => !locked && onChange({ paymentSource: src })}
            disabled={locked}
          >
            <Text style={[styles.chipText, line.paymentSource === src && styles.chipTextOn]}>
              {src}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.value}
            style={[styles.catChip, line.category === c.value && styles.catChipOn]}
            onPress={() => !locked && onChange({ category: c.value })}
            disabled={locked}
          >
            <Text
              style={[styles.catText, line.category === c.value && styles.catTextOn]}
            >
              {c.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <MoneyField
        label="Amount"
        value={line.amount}
        onChange={(v) => onChange({ amount: v })}
        disabled={locked}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="What was this expense for?"
        value={line.description}
        onChangeText={(t) => onChange({ description: t })}
        editable={!locked}
      />

      <Text style={styles.label}>Receipt photos</Text>
      <Text style={styles.hint}>Add one or more invoice photos per expense.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbs}>
        {invoices.map((inv) => (
          <UploadedInvoiceThumb
            key={inv.id}
            invoice={inv}
            locked={locked}
            onRemove={locked ? undefined : () => removeUploaded(inv.id)}
          />
        ))}
        {pending.map((p) => (
          <View key={p.uri} style={styles.thumbWrap}>
            <Image source={{ uri: p.uri }} style={styles.thumb} />
            {!locked && (
              <Pressable style={styles.thumbRemove} onPress={() => removePending(p.uri)}>
                <Text style={styles.thumbRemoveText}>×</Text>
              </Pressable>
            )}
            <Text style={styles.pendingBadge}>New</Text>
          </View>
        ))}
      </ScrollView>

      {!locked && (
        <View style={styles.photoActions}>
          <Pressable style={styles.photoBtn} onPress={() => pickPhoto(true)} disabled={uploading}>
            <Text style={styles.photoBtnText}>📷 Take photo</Text>
          </Pressable>
          <Pressable style={styles.photoBtn} onPress={() => pickPhoto(false)} disabled={uploading}>
            <Text style={styles.photoBtnText}>🖼 Gallery</Text>
          </Pressable>
        </View>
      )}

      {!locked && pending.length > 0 && (
        <Text style={styles.uploadHint}>
          {pending.length} photo(s) will upload when you save the report.
        </Text>
      )}

      {canRemove && !locked && (
        <Pressable onPress={onRemove}>
          <Text style={styles.remove}>Remove expense</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  lineTitle: { fontSize: 15, fontWeight: "700", color: colors.saffronDark, marginBottom: spacing.sm },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  hint: { fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  chipRow: { flexDirection: "row", gap: 8, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.saffron, borderColor: colors.saffron },
  chipText: { fontWeight: "600", color: colors.ink },
  chipTextOn: { color: "#fff" },
  catScroll: { marginBottom: spacing.sm },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  catChipOn: { backgroundColor: colors.cream, borderColor: colors.saffron },
  catText: { fontSize: 12, fontWeight: "600", color: colors.muted },
  catTextOn: { color: colors.saffronDark },
  thumbs: { marginBottom: spacing.sm, minHeight: 88 },
  thumbWrap: { marginRight: 10, position: "relative" },
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
  thumbRemove: {
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
  thumbRemoveText: { color: "#fff", fontSize: 16, fontWeight: "700", lineHeight: 18 },
  pendingBadge: {
    position: "absolute",
    bottom: 2,
    left: 2,
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: colors.saffron,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  photoActions: { flexDirection: "row", gap: 8, marginBottom: spacing.sm },
  photoBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.saffron,
    alignItems: "center",
  },
  photoBtnText: { fontWeight: "600", color: colors.saffronDark, fontSize: 14 },
  uploadHint: { fontSize: 12, color: colors.saffron, marginBottom: spacing.sm },
  remove: { color: colors.danger, fontWeight: "600", textAlign: "center", marginTop: 4 },
});
