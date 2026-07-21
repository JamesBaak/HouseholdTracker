import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../api/client";
import { RECURRENCE_LABELS, RecurrenceType } from "../api/types";
import { useHousehold } from "../context/HouseholdContext";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "AddTask">;

const RECURRENCE_TYPES = Object.keys(RECURRENCE_LABELS) as RecurrenceType[];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AddTaskScreen({ navigation }: Props) {
  const { household, refreshHousehold } = useHousehold();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState<number | null>(
    household?.members[0]?.id ?? null
  );
  const [dueDate, setDueDate] = useState(todayIsoDate());
  const [timeOfDay, setTimeOfDay] = useState("18:00");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("daily");
  const [everyXDays, setEveryXDays] = useState("2");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!household || !assignedToId || !title.trim()) {
      setError("Title and assignee are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createTask(household.id, {
        title: title.trim(),
        description: description.trim(),
        assigned_to_id: assignedToId,
        due_date: dueDate,
        time_of_day: `${timeOfDay}:00`,
        recurrence_type: recurrenceType,
        every_x_days:
          recurrenceType === "every_x_days" ? Number(everyXDays) : null,
      });
      await refreshHousehold();
      navigation.goBack();
    } catch (err) {
      setError("Could not save task. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!household) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Assigned to</Text>
      <View style={styles.chipRow}>
        {household.members.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={[
              styles.chip,
              assignedToId === member.id && styles.chipSelected,
            ]}
            onPress={() => setAssignedToId(member.id)}
          >
            <Text
              style={
                assignedToId === member.id
                  ? styles.chipTextSelected
                  : styles.chipText
              }
            >
              {member.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Due date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} />

      <Text style={styles.label}>Time of day (HH:MM)</Text>
      <TextInput
        style={styles.input}
        value={timeOfDay}
        onChangeText={setTimeOfDay}
      />

      <Text style={styles.label}>Repeats</Text>
      <View style={styles.chipRow}>
        {RECURRENCE_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.chip, recurrenceType === type && styles.chipSelected]}
            onPress={() => setRecurrenceType(type)}
          >
            <Text
              style={
                recurrenceType === type ? styles.chipTextSelected : styles.chipText
              }
            >
              {RECURRENCE_LABELS[type]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {recurrenceType === "every_x_days" && (
        <>
          <Text style={styles.label}>Every how many days?</Text>
          <TextInput
            style={styles.input}
            value={everyXDays}
            onChangeText={setEveryXDays}
            keyboardType="numeric"
          />
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Button title="Save task" onPress={handleSave} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontWeight: "600", marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { backgroundColor: "#1565c0", borderColor: "#1565c0" },
  chipText: { color: "#333" },
  chipTextSelected: { color: "white", fontWeight: "600" },
  error: { color: "red", marginTop: 12 },
});
