import { AttendanceRecord } from '@/types/user';

// Generate some mock attendance data
const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const hour = 60 * 60 * 1000;

export const mockAttendance: AttendanceRecord[] = [
  // Day 1 - Complete day with break
  {
    id: '1',
    userId: '2',
    userName: 'John Employee',
    type: 'check-in',
    timestamp: now - (3 * day) + (8 * hour), // 8:00 AM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  {
    id: '2',
    userId: '2',
    userName: 'John Employee',
    type: 'break-start',
    timestamp: now - (3 * day) + (12 * hour), // 12:00 PM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  {
    id: '3',
    userId: '2',
    userName: 'John Employee',
    type: 'break-end',
    timestamp: now - (3 * day) + (13 * hour), // 1:00 PM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  {
    id: '4',
    userId: '2',
    userName: 'John Employee',
    type: 'check-out',
    timestamp: now - (3 * day) + (17 * hour), // 5:00 PM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  
  // Day 2 - Complete day with break
  {
    id: '5',
    userId: '2',
    userName: 'John Employee',
    type: 'check-in',
    timestamp: now - (2 * day) + (7 * hour) + (30 * 60 * 1000), // 7:30 AM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  {
    id: '6',
    userId: '2',
    userName: 'John Employee',
    type: 'break-start',
    timestamp: now - (2 * day) + (11 * hour) + (45 * 60 * 1000), // 11:45 AM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  {
    id: '7',
    userId: '2',
    userName: 'John Employee',
    type: 'break-end',
    timestamp: now - (2 * day) + (12 * hour) + (45 * 60 * 1000), // 12:45 PM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  {
    id: '8',
    userId: '2',
    userName: 'John Employee',
    type: 'check-out',
    timestamp: now - (2 * day) + (18 * hour), // 6:00 PM (overtime)
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  
  // Day 3 - Complete day with break
  {
    id: '9',
    userId: '2',
    userName: 'John Employee',
    type: 'check-in',
    timestamp: now - day + (8 * hour) + (15 * 60 * 1000), // 8:15 AM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  {
    id: '10',
    userId: '2',
    userName: 'John Employee',
    type: 'break-start',
    timestamp: now - day + (12 * hour) + (30 * 60 * 1000), // 12:30 PM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  {
    id: '11',
    userId: '2',
    userName: 'John Employee',
    type: 'break-end',
    timestamp: now - day + (13 * hour) + (30 * 60 * 1000), // 1:30 PM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  {
    id: '12',
    userId: '2',
    userName: 'John Employee',
    type: 'check-out',
    timestamp: now - day + (17 * hour) + (30 * 60 * 1000), // 5:30 PM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  
  // Sarah's attendance
  {
    id: '13',
    userId: '3',
    userName: 'Sarah Employee',
    type: 'check-in',
    timestamp: now - (3 * day) + (9 * hour), // 9:00 AM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  {
    id: '14',
    userId: '3',
    userName: 'Sarah Employee',
    type: 'break-start',
    timestamp: now - (3 * day) + (13 * hour), // 1:00 PM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  {
    id: '15',
    userId: '3',
    userName: 'Sarah Employee',
    type: 'break-end',
    timestamp: now - (3 * day) + (14 * hour), // 2:00 PM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
  {
    id: '16',
    userId: '3',
    userName: 'Sarah Employee',
    type: 'check-out',
    timestamp: now - (3 * day) + (18 * hour), // 6:00 PM
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Work Street, San Francisco, CA',
    },
    verified: true,
  },
];