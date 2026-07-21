import React, { useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useHousehold } from "../context/HouseholdContext";

export default function HouseholdSetupScreen() {
  const { createHousehold, joinHousehold } = useHousehold();
  const [name, setName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createHousehold(name.trim());
    } catch (err) {
      setError("Could not create household. Is the backend running?");
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    const id = Number(joinId);
    if (!id) {
      setError("Enter a valid household id shared by another member");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await joinHousehold(id);
    } catch (err) {
      setError("Could not find that household");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HouseholdTracker</Text>
      <Text style={styles.subtitle}>Create a new household</Text>
      <TextInput
        style={styles.input}
        placeholder="Household name"
        value={name}
        onChangeText={setName}
      />
      <Button title="Create household" onPress={handleCreate} disabled={busy} />

      <Text style={[styles.subtitle, styles.spacedTop]}>
        Or join an existing household
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Household id"
        value={joinId}
        onChangeText={setJoinId}
        keyboardType="numeric"
      />
      <Button title="Join household" onPress={handleJoin} disabled={busy} />

      {busy && <ActivityIndicator style={styles.spacedTop} />}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 24 },
  subtitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  spacedTop: { marginTop: 24 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  error: { color: "red", marginTop: 12 },
});
