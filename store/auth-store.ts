import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import { Platform } from "react-native";
import { User } from "@/types/user";
import { useBaseUrl } from "@/context/BaseUrlContext";
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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      bearerToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (userName: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const baseUrl = await AsyncStorage.getItem("baseUrl");
          if (!baseUrl) throw new Error("Base URL not configured");

          const response = await fetch(
            `${baseUrl}MiddleWare/NewMobileAppLogin`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userName, password }),
            },
          );

          const data = await response.json();

          if (!data.isSuccess) {
            throw new Error(data.message || "Login failed");
          }

          const user: User = {
            id: data.userID,
            orgId: data.orgID,
            orgName: data.organizationName || "",
            userName: data.userName || userName,
            contactRecordId: data.contactRecordId || 0,
            email: data.email || "",
            role: data.role || "user", // fallback to "user" if missing
            name: data.name || "", // Add name property
          };

          await AsyncStorage.setItem("bearerToken", data.bearerTokenValue);

          set({
            user,
            bearerToken: data.bearerTokenValue,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
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
          // Clear bearer token
          await AsyncStorage.removeItem("bearerToken");

          // Preserve theme and baseUrl settings
          const keys = await AsyncStorage.getAllKeys();
          const keysToPreserve = ["theme-storage", "baseUrl"];
          const keysToRemove = keys.filter(
            (key) => !keysToPreserve.includes(key),
          );
          if (keysToRemove.length > 0) {
            await AsyncStorage.multiRemove(keysToRemove);
          }

          // Reset store state
          set({
            user: null,
            bearerToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Redirect based on platform
          if (Platform.OS === "web") {
            router.replace("/baseurl"); // ✅ Go to base URL screen
          } else {
            router.replace("/(auth)/login"); // ✅ Go to login screen on mobile
          }
        } catch (error) {
          console.error("Logout error:", error);
          set({ isLoading: false });
          throw error;
        }
      },

      updateUser: async (userData: Partial<User>) => {
        const { user } = get();

        if (!user) {
          throw new Error("No user is logged in");
        }

        set({ isLoading: true });

        try {
          const updatedUser = { ...user, ...userData };
          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to update user",
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
