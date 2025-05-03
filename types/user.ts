export type UserRole = "admin" | "employee";

export interface User {
  id: number;
  userName: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  orgId: number;
  orgName: string;
  contactRecordId: number;
}

export type AttendanceType =
  | "check-in"
  | "break-start"
  | "break-end"
  | "check-out";

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  type: AttendanceType;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  verified: boolean;
  imageData?: string; // Base64 encoded image data
}

export interface DailyAttendanceSummary {
  id?: string; // Unique ID for the summary
  userId: string; // User ID for the summary
  date: number; // timestamp for the day
  checkIn?: number; // timestamp
  breakStart?: number; // timestamp
  breakEnd?: number; // timestamp
  checkOut?: number; // timestamp
  sessionOneHours: number; // hours before break
  sessionTwoHours: number; // hours after break
  totalHours: number; // total hours worked
  regularHours: number; // regular hours (typically 8)
  overtimeHours: number; // overtime hours
  approved: boolean; // whether overtime is approved
}

export interface WorkingHoursSettings {
  regularHours: number;
  startTime: string;
  endTime: string;
  breakDuration: number;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  faceVerificationRequired: boolean;
  locationTracking: boolean;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: number;
  endDate: number;
  reason: string;
  type: "sick" | "vacation" | "personal" | "other";
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  approvedBy?: string;
  notes?: string;
}

export interface LeaveBalance {
  userId: string;
  annual: number;
  sick: number;
  personal: number;
  year: number;
}
