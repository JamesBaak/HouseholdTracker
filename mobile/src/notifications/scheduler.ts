import * as Notifications from "expo-notifications";
import { Task } from "../api/types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") {
    return true;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

function taskNotificationId(task: Task): string {
  return `task-${task.id}`;
}

function taskDueDate(task: Task): Date {
  const [year, month, day] = task.due_date.split("-").map(Number);
  const [hour, minute, second] = task.time_of_day.split(":").map(Number);
  return new Date(year, (month ?? 1) - 1, day, hour ?? 0, minute ?? 0, second ?? 0);
}

/**
 * Schedules (or reschedules) a local notification for a task's due date and
 * time of day. Should be called whenever a task is created, completed
 * (recurrence advances due_date), or pushed by vacation mode.
 */
export async function scheduleTaskNotification(task: Task): Promise<void> {
  const identifier = taskNotificationId(task);
  await Notifications.cancelScheduledNotificationAsync(identifier);

  const dueAt = taskDueDate(task);
  if (dueAt.getTime() <= Date.now()) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: task.title,
      body: task.description || "Chore is due now",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dueAt,
    },
  });
}

export async function cancelTaskNotification(task: Task): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(taskNotificationId(task));
}

export async function rescheduleAllTaskNotifications(
  tasks: Task[]
): Promise<void> {
  await Promise.all(tasks.map(scheduleTaskNotification));
}
