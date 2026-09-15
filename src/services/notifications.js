import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  return newStatus === "granted";
}

export async function setupAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Lembretes de pagamento",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

// Agenda uma notificação local para a data indicada.
// Devolve o id da notificação (útil para cancelar mais tarde).
export async function scheduleReminder({ title, body, date }) {
  const granted = await ensureNotificationPermission();
  if (!granted) return null;
  await setupAndroidChannel();

  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { type: "date", date },
  });
  return id;
}

export async function cancelReminder(notificationId) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    // já pode ter disparado ou não existir; ignora
  }
}