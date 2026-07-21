import { Household, NewTaskInput, Person, Task } from "./types";

// Points at the FastAPI backend in backend/. Override for a real device by
// setting EXPO_PUBLIC_API_URL to your machine's LAN IP, e.g.
// http://192.168.1.20:8000 (localhost only works for simulators/emulators).
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request to ${path} failed (${response.status}): ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  createHousehold: (name: string) =>
    request<Household>("/households", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  getHousehold: (householdId: number) =>
    request<Household>(`/households/${householdId}`),

  addMember: (householdId: number, name: string) =>
    request<Person>(`/households/${householdId}/members`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  listTasks: (householdId: number) =>
    request<Task[]>(`/households/${householdId}/tasks`),

  createTask: (householdId: number, task: NewTaskInput) =>
    request<Task>(`/households/${householdId}/tasks`, {
      method: "POST",
      body: JSON.stringify(task),
    }),

  completeTask: (taskId: number) =>
    request<Task>(`/tasks/${taskId}/complete`, { method: "POST" }),

  setVacationMode: (householdId: number, pushDays: number) =>
    request<Task[]>(`/households/${householdId}/vacation`, {
      method: "POST",
      body: JSON.stringify({ push_days: pushDays }),
    }),
};
