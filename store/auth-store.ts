
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import { Platform } from "react-native";
import { User } from "@/types/user";
import { router } from "expo-router";

interface AuthState {
  user: User | null;
  bearerToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isAdmin: () => boolean;
  isEmployee: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      bearerToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      isAdmin: () => {
        const user = get().user;
        return user ? user.role === 'admin' : false;
      },
      isEmployee: () => {
        const user = get().user;
        return user ? user.role === 'employee' : false;
      },

      login: async (userName: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const baseUrl = await AsyncStorage.getItem("baseUrl");
          if (!baseUrl) throw new Error("Base URL not configured");

          const response = await fetch(`${baseUrl}MiddleWare/NewMobileAppLogin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userName, password }),
          });

          const data = await response.json();

          if (!data.isSuccess) {
            throw new Error(data.message || "Login failed");
          }

          // Determine role based on userType from API
          const role = data.userType === 1 ? "admin" : "employee";

          const user: User = {
            id: data.userID,
            orgId: data.orgID,
            orgName: data.organisationName || "Organization",
            userName: userName,
            contactRecordId: data.contactRecordId || 0,
            email: data.email || "",
            role: role,
            name: data.name || userName,
          };

          await AsyncStorage.multiSet([
            ['orgId', data.orgID.toString()],
            ['userId', data.userID.toString()],
            ['bearerToken', data.bearerTokenValue],
            ['userRole', role]
          ]);

          set({
            user,
            bearerToken: data.bearerTokenValue,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Navigate based on role
          if (Platform.OS === "web") {
            router.replace("/(tabs)");
          } else {
            router.replace("/(tabs)");
          }

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            isLoading: false,
            isAuthenticated: false,
            user: null,
            bearerToken: null,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await AsyncStorage.multiRemove([
            "bearerToken",
            "userId",
            "orgId",
            "userRole"
          ]);

          set({
            user: null,
            bearerToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          if (Platform.OS === "web") {
            router.replace("/baseurl");
          } else {
            router.replace("/(auth)/login");
          }
        } catch (error) {
          console.error("Logout error:", error);
          set({ isLoading: false });
          throw error;
        }
      },

      updateUser: async (userData: Partial<User>) => {
        const { user } = get();
        if (!user) throw new Error("No user is logged in");

        set({ isLoading: true });
        try {
          const updatedUser = { ...user, ...userData };
          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to update user",
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
