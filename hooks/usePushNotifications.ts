import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { registerPushToken, routeFromNotificationData } from "@/lib/notifications";

function getExpoProjectId(): string | undefined {
  const id =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!id || id === "replace-with-eas-project-id") return undefined;
  return id;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Saffron reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  const projectId = getExpoProjectId();
  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return token.data;
  } catch {
    return null;
  }
}

function navigateFromResponse(
  router: ReturnType<typeof useRouter>,
  data: Record<string, unknown> | undefined
) {
  const route = routeFromNotificationData(data);
  if (route) router.push(route);
}

/** Register push token and handle notification taps when cashier is signed in. */
export function usePushNotifications(enabled: boolean) {
  const router = useRouter();
  const registeredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (cancelled || !token || token === registeredRef.current) return;
      try {
        await registerPushToken(token, Device.modelName ?? Device.deviceName);
        registeredRef.current = token;
      } catch {
        /* backend unreachable or not logged in yet */
      }
    })();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      navigateFromResponse(router, data);
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, unknown>;
      navigateFromResponse(router, data);
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [enabled, router]);
}
