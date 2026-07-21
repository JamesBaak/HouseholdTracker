import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../api/client";
import { Household } from "../api/types";

const HOUSEHOLD_ID_KEY = "household-tracker:household-id";

interface HouseholdContextValue {
  household: Household | null;
  loading: boolean;
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (householdId: number) => Promise<void>;
  refreshHousehold: () => Promise<void>;
  addMember: (name: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextValue | undefined>(
  undefined
);

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStoredHousehold = useCallback(async () => {
    setLoading(true);
    try {
      const storedId = await AsyncStorage.getItem(HOUSEHOLD_ID_KEY);
      if (storedId) {
        const fetched = await api.getHousehold(Number(storedId));
        setHousehold(fetched);
      }
    } catch (error) {
      console.warn("Failed to restore household session", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredHousehold();
  }, [loadStoredHousehold]);

  const persistHouseholdId = useCallback(async (id: number) => {
    await AsyncStorage.setItem(HOUSEHOLD_ID_KEY, String(id));
  }, []);

  const createHousehold = useCallback(
    async (name: string) => {
      const created = await api.createHousehold(name);
      await persistHouseholdId(created.id);
      setHousehold(created);
    },
    [persistHouseholdId]
  );

  const joinHousehold = useCallback(
    async (householdId: number) => {
      const fetched = await api.getHousehold(householdId);
      await persistHouseholdId(fetched.id);
      setHousehold(fetched);
    },
    [persistHouseholdId]
  );

  const refreshHousehold = useCallback(async () => {
    if (!household) {
      return;
    }
    const fetched = await api.getHousehold(household.id);
    setHousehold(fetched);
  }, [household]);

  const addMember = useCallback(
    async (name: string) => {
      if (!household) {
        return;
      }
      await api.addMember(household.id, name);
      await refreshHousehold();
    },
    [household, refreshHousehold]
  );

  const leaveHousehold = useCallback(async () => {
    await AsyncStorage.removeItem(HOUSEHOLD_ID_KEY);
    setHousehold(null);
  }, []);

  const value = useMemo(
    () => ({
      household,
      loading,
      createHousehold,
      joinHousehold,
      refreshHousehold,
      addMember,
      leaveHousehold,
    }),
    [
      household,
      loading,
      createHousehold,
      joinHousehold,
      refreshHousehold,
      addMember,
      leaveHousehold,
    ]
  );

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold(): HouseholdContextValue {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return context;
}
