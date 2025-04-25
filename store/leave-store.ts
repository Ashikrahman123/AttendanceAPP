import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LeaveRequest, LeaveBalance } from '@/types/user';

interface LeaveState {
  requests: LeaveRequest[];
  balances: LeaveBalance[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchLeaveRequests: (userId: string) => Promise<LeaveRequest[]>;
  fetchLeaveBalance: (userId: string) => Promise<LeaveBalance | undefined>;
  submitLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => Promise<LeaveRequest>;
  updateLeaveRequest: (requestId: string, status: 'approved' | 'rejected', approverUserId?: string, notes?: string) => Promise<void>;
  cancelLeaveRequest: (requestId: string) => Promise<void>;
}

// Initial leave balances for new users
const DEFAULT_LEAVE_BALANCE = {
  annual: 20,
  sick: 10,
  personal: 5,
  year: new Date().getFullYear(),
};

export const useLeaveStore = create<LeaveState>()(
  persist(
    (set, get) => ({
      requests: [],
      balances: [],
      isLoading: false,
      error: null,
      
      fetchLeaveRequests: async (userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const { requests } = get();
          const userRequests = requests.filter(req => req.userId === userId);
          
          set({ isLoading: false });
          return userRequests;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch leave requests', 
            isLoading: false 
          });
          return [];
        }
      },
      
      fetchLeaveBalance: async (userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 600));
          
          const { balances } = get();
          let userBalance = balances.find(balance => balance.userId === userId);
          
          // If no balance exists for this user, create a default one
          if (!userBalance) {
            userBalance = {
              userId,
              ...DEFAULT_LEAVE_BALANCE,
            };
            
            // Save the new balance
            set({ balances: [...balances, userBalance] });
          }
          
          set({ isLoading: false });
          return userBalance;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch leave balance', 
            isLoading: false 
          });
          return undefined;
        }
      },
      
      submitLeaveRequest: async (requestData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Create new request
          const newRequest: LeaveRequest = {
            id: Date.now().toString(),
            createdAt: Date.now(),
            status: 'pending',
            ...requestData,
          };
          
          // Update state
          const { requests } = get();
          set({ requests: [...requests, newRequest], isLoading: false });
          
          return newRequest;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to submit leave request', 
            isLoading: false 
          });
          throw error;
        }
      },
      
      updateLeaveRequest: async (requestId, status, approverUserId, notes) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const { requests, balances } = get();
          const requestIndex = requests.findIndex(req => req.id === requestId);
          
          if (requestIndex === -1) {
            throw new Error('Leave request not found');
          }
          
          const request = requests[requestIndex];
          const updatedRequest = {
            ...request,
            status,
            approvedBy: approverUserId,
            notes: notes || request.notes,
          };
          
          // Update the request
          const updatedRequests = [...requests];
          updatedRequests[requestIndex] = updatedRequest;
          
          // If approved, update the leave balance
          if (status === 'approved') {
            const userBalanceIndex = balances.findIndex(balance => balance.userId === request.userId);
            
            if (userBalanceIndex !== -1) {
              const userBalance = balances[userBalanceIndex];
              const daysRequested = Math.ceil((request.endDate - request.startDate) / (1000 * 60 * 60 * 24)) + 1;
              
              // Update the appropriate leave type
              const updatedBalance = { ...userBalance };
              switch (request.type) {
                case 'vacation':
                  updatedBalance.annual = Math.max(0, updatedBalance.annual - daysRequested);
                  break;
                case 'sick':
                  updatedBalance.sick = Math.max(0, updatedBalance.sick - daysRequested);
                  break;
                case 'personal':
                  updatedBalance.personal = Math.max(0, updatedBalance.personal - daysRequested);
                  break;
                default:
                  // For 'other' type, deduct from annual
                  updatedBalance.annual = Math.max(0, updatedBalance.annual - daysRequested);
              }
              
              // Update balances
              const updatedBalances = [...balances];
              updatedBalances[userBalanceIndex] = updatedBalance;
              
              set({ requests: updatedRequests, balances: updatedBalances, isLoading: false });
            } else {
              set({ requests: updatedRequests, isLoading: false });
            }
          } else {
            set({ requests: updatedRequests, isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update leave request', 
            isLoading: false 
          });
          throw error;
        }
      },
      
      cancelLeaveRequest: async (requestId) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 600));
          
          const { requests } = get();
          const filteredRequests = requests.filter(req => req.id !== requestId);
          
          set({ requests: filteredRequests, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to cancel leave request', 
            isLoading: false 
          });
          throw error;
        }
      },
    }),
    {
      name: 'leave-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);