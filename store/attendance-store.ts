import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AttendanceRecord, AttendanceType, DailyAttendanceSummary } from '@/types/user';
import { mockAttendance } from '@/mocks/attendance';
import { getCurrentLocation, getAddressFromCoordinates } from '@/utils/location-service';
import { isSameDay, startOfDay, endOfDay, differenceInHours, differenceInMinutes } from '@/utils/date-formatter';

interface AttendanceState {
  records: AttendanceRecord[];
  summaries: DailyAttendanceSummary[];
  isLoading: boolean;
  error: string | null;
  fetchAttendance: (userId?: string) => Promise<AttendanceRecord[]>;
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'timestamp' | 'location' | 'verified'> & { verified?: boolean, imageData?: string }) => Promise<AttendanceRecord>;
  getLastAttendanceRecord: (userId: string) => AttendanceRecord | undefined;
  getTodayRecords: (userId: string) => AttendanceRecord[];
  getDailyAttendanceSummaries: (userId: string, month?: number, year?: number) => DailyAttendanceSummary[];
  getTodayAttendanceSummary: (userId: string) => DailyAttendanceSummary | undefined;
  calculateAttendanceSummaries: (userId: string) => void;
  getNextExpectedAction: (userId: string) => AttendanceType | null;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      records: mockAttendance,
      summaries: [],
      isLoading: false,
      error: null,
      
      fetchAttendance: async (userId?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const { records } = get();
          const filteredRecords = userId 
            ? records.filter(record => record.userId === userId)
            : records;
          
          set({ isLoading: false });
          return filteredRecords;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch attendance records', 
            isLoading: false 
          });
          return [];
        }
      },
      
      addAttendanceRecord: async (recordData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Get current location
          const location = await getCurrentLocation();
          const { latitude, longitude } = location.coords;
          
          // Get address from coordinates
          const address = await getAddressFromCoordinates(latitude, longitude);
          
          // Create new record
          const newRecord: AttendanceRecord = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            location: {
              latitude,
              longitude,
              address: address || undefined,
            },
            verified: recordData.verified !== undefined ? recordData.verified : false,
            imageData: recordData.imageData,
            ...recordData,
          };
          
          // Update state
          const { records } = get();
          const updatedRecords = [...records, newRecord];
          set({ records: updatedRecords, isLoading: false });
          
          // Recalculate summaries
          get().calculateAttendanceSummaries(newRecord.userId);
          
          return newRecord;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add attendance record', 
            isLoading: false 
          });
          throw error;
        }
      },
      
      getLastAttendanceRecord: (userId: string) => {
        const { records } = get();
        const today = new Date();
        const startOfToday = startOfDay(today.getTime());
        const endOfToday = endOfDay(today.getTime());
        
        // Get today's records for the user
        const todayRecords = records.filter(record => 
          record.userId === userId && 
          record.timestamp >= startOfToday &&
          record.timestamp <= endOfToday
        );
        
        if (todayRecords.length === 0) {
          return undefined;
        }
        
        // Sort by timestamp (descending) and get the first one
        return todayRecords.sort((a, b) => b.timestamp - a.timestamp)[0];
      },
      
      getTodayRecords: (userId: string) => {
        const { records } = get();
        const today = new Date().getTime();
        
        return records.filter(record => 
          record.userId === userId && isSameDay(record.timestamp, today)
        ).sort((a, b) => a.timestamp - b.timestamp);
      },
      
      getDailyAttendanceSummaries: (userId: string, month?: number, year?: number) => {
        const { summaries } = get();
        const userSummaries = summaries.filter(summary => {
          const date = new Date(summary.date);
          return (
            summary.userId === userId &&
            (month === undefined || date.getMonth() === month) &&
            (year === undefined || date.getFullYear() === year)
          );
        });
        
        return userSummaries.sort((a, b) => b.date - a.date);
      },
      
      getTodayAttendanceSummary: (userId: string) => {
        const { summaries } = get();
        const today = new Date().getTime();
        
        return summaries.find(summary => 
          summary.userId === userId && isSameDay(summary.date, today)
        );
      },
      
      calculateAttendanceSummaries: (userId: string) => {
        const { records, summaries } = get();
        const userRecords = records.filter(record => record.userId === userId);
        
        // Group records by day
        const recordsByDay: { [key: string]: AttendanceRecord[] } = {};
        
        userRecords.forEach(record => {
          const date = startOfDay(record.timestamp);
          const dateKey = date.toString();
          
          if (!recordsByDay[dateKey]) {
            recordsByDay[dateKey] = [];
          }
          
          recordsByDay[dateKey].push(record);
        });
        
        // Calculate summaries for each day
        const newSummaries: DailyAttendanceSummary[] = [];
        
        Object.entries(recordsByDay).forEach(([dateKey, dayRecords]) => {
          const date = parseInt(dateKey);
          const sortedRecords = dayRecords.sort((a, b) => a.timestamp - b.timestamp);
          
          let checkIn: number | undefined;
          let breakStart: number | undefined;
          let breakEnd: number | undefined;
          let checkOut: number | undefined;
          
          // Find the timestamps for each action
          sortedRecords.forEach(record => {
            switch (record.type) {
              case 'check-in':
                if (!checkIn) checkIn = record.timestamp;
                break;
              case 'break-start':
                if (!breakStart || record.timestamp > breakStart) {
                  breakStart = record.timestamp;
                }
                break;
              case 'break-end':
                if (!breakEnd || record.timestamp > breakEnd) {
                  breakEnd = record.timestamp;
                }
                break;
              case 'check-out':
                if (!checkOut || record.timestamp > checkOut) {
                  checkOut = record.timestamp;
                }
                break;
            }
          });
          
          // Calculate hours
          let sessionOneHours = 0;
          let sessionTwoHours = 0;
          let totalHours = 0;
          
          if (checkIn) {
            if (breakStart) {
              // Session 1: Check-in to Break-start
              sessionOneHours = differenceInHours(checkIn, breakStart);
              
              if (breakEnd && checkOut) {
                // Session 2: Break-end to Check-out
                sessionTwoHours = differenceInHours(breakEnd, checkOut);
              }
            } else if (checkOut) {
              // No break: Check-in to Check-out
              sessionOneHours = differenceInHours(checkIn, checkOut);
            }
            
            totalHours = sessionOneHours + sessionTwoHours;
          }
          
          // Default regular hours is 8
          const regularHours = 8;
          const overtimeHours = Math.max(0, totalHours - regularHours);
          
          // Create or update summary
          const existingSummaryIndex = summaries.findIndex(s => 
            s.userId === userId && isSameDay(s.date, date)
          );
          
          const summary: DailyAttendanceSummary = {
            id: `${userId}-${date}`,
            userId,
            date,
            checkIn,
            breakStart,
            breakEnd,
            checkOut,
            sessionOneHours,
            sessionTwoHours,
            totalHours,
            regularHours,
            overtimeHours,
            approved: false, // Default to not approved
          };
          
          if (existingSummaryIndex >= 0) {
            // Update existing summary
            newSummaries.push({
              ...summaries[existingSummaryIndex],
              ...summary,
              // Preserve approval status
              approved: summaries[existingSummaryIndex].approved,
            });
          } else {
            // Add new summary
            newSummaries.push(summary);
          }
        });
        
        // Update summaries
        const otherSummaries = summaries.filter(summary => summary.userId !== userId);
        set({ summaries: [...otherSummaries, ...newSummaries] });
      },
      
      getNextExpectedAction: (userId: string) => {
        const todayRecords = get().getTodayRecords(userId);
        
        if (todayRecords.length === 0) {
          return 'check-in';
        }
        
        const lastRecord = todayRecords[todayRecords.length - 1];
        
        switch (lastRecord.type) {
          case 'check-in':
            return 'break-start';
          case 'break-start':
            return 'break-end';
          case 'break-end':
            return 'check-out';
          case 'check-out':
            return null; // Day is complete
          default:
            return 'check-in';
        }
      },
    }),
    {
      name: 'attendance-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);