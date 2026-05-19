import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "@/lib/api";
import { fmt } from "@/lib/calc";
import { loadTodayEntry } from "@/lib/entries";
import { useAuth } from "@/context/AuthContext";
import {
  fetchInbox,
  inboxRoute,
  type InboxItem,
} from "@/lib/notifications";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { reportDateRelativeLabel } from "@/lib/dates";
import { StatusPill } from "@/components/ui/StatusPill";
import { colors, spacing } from "@/lib/theme";
import type { WorkSchedule } from "@/lib/types";

type DashboardData = {
  date: string;
  totalSales: number;
  cashSales: number;
  cardSales: number;
  expenses: number;
  difference: number;
  entries: { id: string; status: string; difference: number }[];
};

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [schedule, setSchedule] = useState<WorkSchedule | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dash, sched, alerts, todayEntry] = await Promise.all([
        api<DashboardData>("/dashboard"),
        api<WorkSchedule>("/shifts/today").catch(() => null),
        fetchInbox().catch(() => [] as InboxItem[]),
        loadTodayEntry().catch(() => null),
      ]);
      setData(dash);
      setSchedule(sched);
      setInbox(alerts.slice(0, 5));
      if (todayEntry && dash.entries.length === 0) {
        setData({
          ...dash,
          entries: [
            {
              id: todayEntry.id,
              status: todayEntry.status,
              difference: todayEntry.difference ?? 0,
            },
          ],
        });
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.saffron} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>Could not load dashboard</Text>
        <Button title="Retry" onPress={load} />
      </View>
    );
  }

  const myEntry = data.entries[0];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
      }
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Hi, {user?.name?.split(" ")[0]}</Text>
          <Text style={styles.date}>
            {reportDateRelativeLabel(data.date)} · {data.date}
          </Text>
        </View>
        <Pressable onPress={logout}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>

      {schedule && (
        <View
          style={[
            styles.banner,
            schedule.working ? styles.bannerOk : styles.bannerWarn,
          ]}
        >
          <Text style={styles.bannerText}>
            {schedule.working
              ? `Your shift: ${schedule.hoursLabel}${schedule.closingOnly ? " (closing)" : ""}`
              : "Not scheduled today"}
          </Text>
        </View>
      )}

      <View style={styles.statGrid}>
        <View style={[styles.stat, styles.statAccent]}>
          <Text style={styles.statLabelLight}>Total sales</Text>
          <Text style={styles.statValueLight}>{fmt(data.totalSales)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Cash</Text>
          <Text style={styles.statValue}>{fmt(data.cashSales)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Card</Text>
          <Text style={styles.statValue}>{fmt(data.cardSales)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={styles.statValue}>{fmt(data.expenses)}</Text>
        </View>
        <View
          style={[
            styles.stat,
            data.difference < -0.01 && styles.statWarn,
          ]}
        >
          <Text style={styles.statLabel}>Difference</Text>
          <Text style={styles.statValue}>{fmt(data.difference)}</Text>
        </View>
      </View>

      {myEntry ? (
        <Card>
          <Text style={styles.cardTitle}>Your report today</Text>
          <View style={styles.row}>
            <StatusPill status={myEntry.status} />
            <Text
              style={[
                styles.diff,
                myEntry.difference < -0.01 && { color: colors.danger },
              ]}
            >
              {fmt(myEntry.difference)}
            </Text>
          </View>
          <Button
            title={myEntry.status === "LOCKED" ? "View report" : "Continue report"}
            onPress={() => router.push("/report")}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      ) : (
        <Card>
          <Text style={styles.cardTitle}>No report yet today</Text>
          <Text style={styles.cardSub}>Start your daily cash report.</Text>
          <Button title="+ New report" onPress={() => router.push("/report")} />
        </Card>
      )}

      {inbox.length > 0 && (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.cardTitle}>Reminders</Text>
          {inbox.map((item, i) => (
            <Pressable
              key={item.id}
              style={[styles.alertRow, i > 0 && styles.alertRowBorder]}
              onPress={() => router.push(inboxRoute(item.type))}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>{item.title}</Text>
                <Text style={styles.alertBody} numberOfLines={2}>
                  {item.body}
                </Text>
              </View>
              <Text style={styles.alertChevron}>›</Text>
            </Pressable>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.md, paddingBottom: 32 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.cream,
  },
  err: { marginBottom: spacing.md, color: colors.muted },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  greeting: { fontSize: 24, fontWeight: "700", color: colors.ink },
  date: { color: colors.muted, marginTop: 2 },
  logout: { color: colors.saffron, fontWeight: "600", fontSize: 14 },
  banner: { borderRadius: 12, padding: 12, marginBottom: spacing.md },
  bannerOk: { backgroundColor: "#dbeafe" },
  bannerWarn: { backgroundColor: "#fef3c7" },
  bannerText: { fontSize: 14, fontWeight: "500", color: colors.ink },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  stat: {
    width: "47%",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statAccent: {
    width: "100%",
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
  statLabel: { fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase" },
  statLabelLight: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.8)", textTransform: "uppercase" },
  statValue: { fontSize: 20, fontWeight: "700", marginTop: 4, color: colors.ink },
  statValueLight: { fontSize: 22, fontWeight: "700", marginTop: 4, color: "#fff" },
  statWarn: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  cardTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  cardSub: { color: colors.muted, marginBottom: spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  diff: { fontSize: 18, fontWeight: "700" },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 8,
  },
  alertRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  alertTitle: { fontSize: 14, fontWeight: "600", color: colors.ink },
  alertBody: { fontSize: 13, color: colors.muted, marginTop: 2 },
  alertChevron: { fontSize: 22, color: colors.muted, fontWeight: "300" },
});
