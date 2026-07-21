import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../api/client";
import { RECURRENCE_LABELS, Task } from "../api/types";
import { useHousehold } from "../context/HouseholdContext";
import {
  rescheduleAllTaskNotifications,
  requestNotificationPermission,
} from "../notifications/scheduler";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "TaskList">;

export default function TaskListScreen({ navigation }: Props) {
  const { household, refreshHousehold, leaveHousehold, addMember } =
    useHousehold();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [vacationModalVisible, setVacationModalVisible] = useState(false);
  const [vacationDays, setVacationDays] = useState("7");
  const [newMemberName, setNewMemberName] = useState("");

  const memberNameById = new Map(
    (household?.members ?? []).map((member) => [member.id, member.name])
  );

  const loadTasks = useCallback(async () => {
    if (!household) {
      return;
    }
    setLoading(true);
    try {
      const fetched = await api.listTasks(household.id);
      setTasks(fetched);
      await requestNotificationPermission();
      await rescheduleAllTaskNotifications(fetched);
    } finally {
      setLoading(false);
    }
  }, [household]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleComplete = async (task: Task) => {
    await api.completeTask(task.id);
    await loadTasks();
  };

  const handleVacationMode = () => {
    setVacationModalVisible(true);
  };

  const confirmVacationMode = async () => {
    const days = Number(vacationDays);
    if (!household || Number.isNaN(days) || days < 0) {
      return;
    }
    await api.setVacationMode(household.id, days);
    setVacationModalVisible(false);
    await loadTasks();
    await refreshHousehold();
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      return;
    }
    await addMember(newMemberName.trim());
    setNewMemberName("");
  };

  if (!household) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{household.name}</Text>
        <Text style={styles.subtitle}>Household id: {household.id}</Text>
        {household.vacation_mode && (
          <Text style={styles.vacationBanner}>Vacation mode is on</Text>
        )}
      </View>

      <View style={styles.memberRow}>
        <Text style={styles.subtitle}>
          Members: {household.members.map((m) => m.name).join(", ") || "none"}
        </Text>
        <View style={styles.actionsRow}>
          <TextInput
            style={[styles.input, styles.memberInput]}
            placeholder="New member name"
            value={newMemberName}
            onChangeText={setNewMemberName}
          />
          <Button title="Add" onPress={handleAddMember} />
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Button title="Add task" onPress={() => navigation.navigate("AddTask")} />
        <Button title="Vacation mode" onPress={handleVacationMode} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.spacedTop} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(task) => String(task.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              {!!item.description && (
                <Text style={styles.taskDescription}>{item.description}</Text>
              )}
              <Text style={styles.taskMeta}>
                Assigned to: {memberNameById.get(item.assigned_to_id) ?? "?"}
              </Text>
              <Text style={styles.taskMeta}>
                Due: {item.due_date} at {item.time_of_day.slice(0, 5)}
              </Text>
              <Text style={styles.taskMeta}>
                Repeats: {RECURRENCE_LABELS[item.recurrence_type]}
                {item.recurrence_type === "every_x_days"
                  ? ` (${item.every_x_days} days)`
                  : ""}
              </Text>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleComplete(item)}
              >
                <Text style={styles.completeButtonText}>Mark complete</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No tasks yet. Add one to get started.</Text>
          }
        />
      )}

      <Button title="Leave household" onPress={leaveHousehold} color="#999" />

      <Modal visible={vacationModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.subtitle}>
              Push every task's due date by how many days?
            </Text>
            <TextInput
              style={styles.input}
              value={vacationDays}
              onChangeText={setVacationDays}
              keyboardType="numeric"
            />
            <View style={styles.actionsRow}>
              <Button
                title="Cancel"
                onPress={() => setVacationModalVisible(false)}
                color="#999"
              />
              <Button title="Confirm" onPress={confirmVacationMode} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#666" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  spacedTop: { marginTop: 24 },
  list: { paddingBottom: 24 },
  taskCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  taskTitle: { fontSize: 18, fontWeight: "600" },
  taskDescription: { color: "#444", marginTop: 4 },
  taskMeta: { color: "#666", marginTop: 2, fontSize: 13 },
  completeButton: {
    marginTop: 10,
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  completeButtonText: { color: "white", fontWeight: "600" },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
  vacationBanner: { color: "#e65100", marginTop: 4, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 12,
  },
  memberRow: { marginBottom: 12 },
  memberInput: { flex: 1, marginVertical: 0, marginRight: 8 },
});
