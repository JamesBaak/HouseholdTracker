import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import {
  HouseholdProvider,
  useHousehold,
} from "./src/context/HouseholdContext";
import { RootStackParamList } from "./src/navigation/types";
import AddTaskScreen from "./src/screens/AddTaskScreen";
import HouseholdSetupScreen from "./src/screens/HouseholdSetupScreen";
import TaskListScreen from "./src/screens/TaskListScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { household, loading } = useHousehold();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {household ? (
        <>
          <Stack.Screen
            name="TaskList"
            component={TaskListScreen}
            options={{ title: household.name }}
          />
          <Stack.Screen
            name="AddTask"
            component={AddTaskScreen}
            options={{ title: "Add task" }}
          />
        </>
      ) : (
        <Stack.Screen
          name="HouseholdSetup"
          component={HouseholdSetupScreen}
          options={{ title: "HouseholdTracker" }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <HouseholdProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
    </HouseholdProvider>
  );
}
