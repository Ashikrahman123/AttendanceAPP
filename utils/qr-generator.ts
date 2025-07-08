
export interface LocationConfig {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
}

// Define your office locations
export const OFFICE_LOCATIONS: LocationConfig[] = [
  {
    code: "HO01",
    name: "Head Office 01",
    latitude: 10.757626,
    longitude: 78.691711
  },
  {
    code: "SO01", 
    name: "Sub Office 01",
    latitude: 10.760000, // Replace with actual coordinates
    longitude: 78.690000  // Replace with actual coordinates
  },
  // Add more locations as needed
];

export type QRAttendanceAction = "CHECK_IN" | "CHECK_OUT" | "START_BREAK" | "END_BREAK";

export interface QRAttendanceData {
  action: QRAttendanceAction;
  locationCode: string;
  lat: number;
  lng: number;
  timestamp: number; // When QR was generated
}

/**
 * Generate QR data for attendance at a specific location
 */
export function generateAttendanceQRData(
  action: QRAttendanceAction,
  locationCode: string
): string {
  const location = OFFICE_LOCATIONS.find(loc => loc.code === locationCode);
  
  if (!location) {
    throw new Error(`Location with code ${locationCode} not found`);
  }
  
  const qrData: QRAttendanceData = {
    action,
    locationCode: location.code,
    lat: location.latitude,
    lng: location.longitude,
    timestamp: Date.now()
  };
  
  return JSON.stringify(qrData);
}

/**
 * Generate QR data for all attendance actions at a location
 */
export function generateLocationQRCodes(locationCode: string) {
  const actions: QRAttendanceAction[] = ["CHECK_IN", "CHECK_OUT", "START_BREAK", "END_BREAK"];
  
  return actions.map(action => ({
    action,
    qrData: generateAttendanceQRData(action, locationCode)
  }));
}

/**
 * Parse QR data back to structured format
 */
export function parseQRData(qrData: string): QRAttendanceData {
  try {
    const parsed = JSON.parse(qrData);
    
    // Validate structure
    if (!parsed.action || !parsed.locationCode || !parsed.lat || !parsed.lng) {
      throw new Error('Invalid QR data structure');
    }
    
    return parsed as QRAttendanceData;
  } catch (error) {
    throw new Error('Failed to parse QR data');
  }
}

/**
 * Get location info by code
 */
export function getLocationByCode(code: string): LocationConfig | undefined {
  return OFFICE_LOCATIONS.find(loc => loc.code === code);
}
