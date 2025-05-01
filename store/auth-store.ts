
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types/user';
import { useBaseUrl } from '@/context/BaseUrlContext';

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
          // Get base URL from AsyncStorage directly
          const baseUrl = await AsyncStorage.getItem('baseUrl');
          if (!baseUrl) throw new Error('Base URL not configured');

          const response = await fetch(`${baseUrl}MiddleWare/MobileAppLogin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userName, password }),
          });

          const data = await response.json();

          if (!data.isSuccess || !data.authenticationModel.isLoginSucess) {
            throw new Error(data.authenticationModel.failureMessage || 'Login failed');
          }

          const { authenticationModel } = data;
          
          const user: User = {
            id: authenticationModel.recordId,
            email: authenticationModel.userName,
            orgId: authenticationModel.orgId,
            orgName: authenticationModel.organizationName,
            contactRecordId: authenticationModel.contactRecordId,
          };

          // Store bearer token
          await AsyncStorage.setItem('bearerToken', authenticationModel.bearerTokenValue);
          
          set({ 
            user,
            bearerToken: authenticationModel.bearerTokenValue,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
            isAuthenticated: false,
            user: null,
            bearerToken: null
          });
          throw error;
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        
        try {
          // Clear bearer token
          await AsyncStorage.removeItem('bearerToken');
          
          // Clear all session data except theme
          const keys = await AsyncStorage.getAllKeys();
          const keysToRemove = keys.filter(key => 
            key !== 'theme-storage' && 
            key !== 'baseUrl'
          );
          
          if (keysToRemove.length > 0) {
            await AsyncStorage.multiRemove(keysToRemove);
          }
          
          set({ 
            user: null,
            bearerToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Logout error:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      updateUser: async (userData: Partial<User>) => {
        const { user } = get();
        
        if (!user) {
          throw new Error('No user is logged in');
        }
        
        set({ isLoading: true });
        
        try {
          const updatedUser = { ...user, ...userData };
          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update user', 
            isLoading: false 
          });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
