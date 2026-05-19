import { api } from "./api";

export type CashierNotificationType =
  | "MISSING_REPORT"
  | "CLOSING_REMINDER"
  | "TOMORROW_SHIFT";

export type InboxItem = {
  id: string;
  type: CashierNotificationType;
  title: string;
  body: string;
  referenceDate: string;
  sentAt: string;
};

export type NotificationData = {
  screen?: "report" | "schedule";
  type?: CashierNotificationType;
  referenceDate?: string;
};

export async function registerPushToken(
  expoPushToken: string,
  deviceName?: string | null
): Promise<void> {
  await api<{ ok: boolean }>("/notifications/register-token", {
    method: "POST",
    body: JSON.stringify({
      expoPushToken,
      deviceName: deviceName ?? undefined,
    }),
  });
}

export async function fetchInbox(): Promise<InboxItem[]> {
  return api<InboxItem[]>("/notifications/inbox");
}

export function inboxRoute(type: CashierNotificationType): "/report" | "/schedule" {
  if (type === "TOMORROW_SHIFT") return "/schedule";
  return "/report";
}

export function routeFromNotificationData(
  data: Record<string, unknown> | undefined
): "/report" | "/schedule" | null {
  if (!data) return null;
  const screen = data.screen;
  if (screen === "report" || screen === "schedule") return `/${screen}`;
  const type = data.type;
  if (type === "TOMORROW_SHIFT") return "/schedule";
  if (type === "MISSING_REPORT" || type === "CLOSING_REMINDER") return "/report";
  return null;
}
