import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types/user';
import { mockUsers } from '@/mocks/users';
import { router } from 'expo-router';

interface AuthState {
  user: User | null;
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
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Find user with matching email (in a real app, check password too)
          const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
          
          if (!user) {
            throw new Error('Invalid email or password');
          }
          
          // In a real app, you would validate the password here
          
          set({ user, isAuthenticated: true, isLoading: false, error: null });
          return Promise.resolve();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An unknown error occurred', 
            isLoading: false,
            isAuthenticated: false,
            user: null
          });
          return Promise.reject(error);
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Reset the state
          set({ user: null, isAuthenticated: false, isLoading: false, error: null });
          
          // Clear all session data
          // We need to preserve the theme settings, so we don't use AsyncStorage.clear()
          const keys = await AsyncStorage.getAllKeys();
          const keysToRemove = keys.filter(key => 
            key !== 'theme-storage' && 
            key !== 'zustand-middleware-debug'
          );
          
          if (keysToRemove.length > 0) {
            await AsyncStorage.multiRemove(keysToRemove);
          }
          
          // Navigate to splash screen
          router.replace('/');
          
          return Promise.resolve();
        } catch (error) {
          console.error('Logout error:', error);
          set({ isLoading: false });
          return Promise.reject(error);
        }
      },
      
      updateUser: async (userData: Partial<User>) => {
        const { user } = get();
        
        if (!user) {
          throw new Error('No user is logged in');
        }
        
        set({ isLoading: true });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const updatedUser = { ...user, ...userData };
          set({ user: updatedUser, isLoading: false });
          return Promise.resolve();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update user', 
            isLoading: false 
          });
          return Promise.reject(error);
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);