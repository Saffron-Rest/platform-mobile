import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { colors, spacing } from "@/lib/theme";
import type { ScheduleRow } from "@/lib/types";

function monthRange(year: number, month: number) {
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const last = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

export default function ScheduleScreen() {
  const { user } = useAuth();
  const today = new Date();
  const [year] = useState(today.getFullYear());
  const [month] = useState(today.getMonth());
  const [byDate, setByDate] = useState<Record<string, ScheduleRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { from, to } = monthRange(year, month);
      const data = await api<Record<string, ScheduleRow[]>>(
        `/shifts/range?from=${from}&to=${to}`
      );
      setByDate(data);
    } catch {
      setByDate({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const myShifts = useMemo(() => {
    const list: (ScheduleRow & { date: string })[] = [];
    for (const [date, rows] of Object.entries(byDate)) {
      for (const row of rows) {
        if (row.userId === user?.id) {
          list.push({ ...row, date });
        }
      }
    }
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [byDate, user?.id]);

  const monthName = new Date(year, month, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.saffron} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.month}>{monthName}</Text>
      <FlatList
        data={myShifts}
        keyExtractor={(item) => `${item.date}-${item.userId}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          <Card>
            <Text style={styles.empty}>No shifts scheduled this month.</Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.date}>
              {new Date(item.date + "T12:00:00").toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.hours}>{item.hoursLabel}</Text>
            {item.closingOnly && (
              <Text style={styles.tag}>Closing report</Text>
            )}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  month: {
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    color: colors.ink,
  },
  list: { padding: spacing.md, paddingBottom: 32 },
  empty: { textAlign: "center", color: colors.muted },
  date: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  hours: { fontSize: 15, color: colors.muted },
  tag: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: colors.saffronDark,
  },
});
