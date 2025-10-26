// src/utils/api.ts

// Separate endpoints for GET (NTS/attendance) and SAVE (fallback to previous add endpoint unless overridden)
const ATTENDANCE_GET_URL =
    process.env.NEXT_PUBLIC_ORDS_GET_URL?.trim() ||
    "https://mailnts.informatixsystems.com:8443/ords/intern/NTS/attendance";

const ATTENDANCE_SAVE_URL =
    process.env.NEXT_PUBLIC_ORDS_SAVE_URL?.trim() ||
    "https://mailnts.informatixsystems.com:8443/ords/intern/mms1_attendance1/add";

// --- API Types ---
interface ApiAttendanceRecord {
    attendance_id: number;
    attendance_date: string;
    emp_code: string;
    is_taking_lunch: 0 | 1;
    is_taking_dinner: 0 | 1;
    payment_status: string;
    emp_name?: string; 
    dept_name?: string;
}

export interface AttendanceListItem extends Omit<ApiAttendanceRecord, 'is_taking_lunch' | 'is_taking_dinner'> {
    id: number; 
    initials: string;
    name: string;
    dept: string;
    lunch: boolean;
    dinner: boolean;
    avatarColor: string;
}

// Derive display-friendly fields from API (handle variant keys gracefully)
type UnknownRecord = ApiAttendanceRecord & Record<string, unknown>;

const pickString = (obj: UnknownRecord, keys: string[]): string | undefined => {
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === 'string' && v.trim().length > 0) return v.trim();
    }
    return undefined;
};

const getDisplayName = (record: ApiAttendanceRecord): string => {
    const obj = record as unknown as UnknownRecord;
    // Try a set of likely field names seen across ORDS/DB views
    const name = pickString(obj, [
        'emp_name', 'EMP_NAME', 'employee_name', 'EMPLOYEE_NAME', 'name', 'Name', 'EMPLOYEE', 'employee'
    ]);
    return name ?? 'Unknown';
};

const getDeptName = (record: ApiAttendanceRecord): string => {
    const obj = record as unknown as UnknownRecord;
    const dept = pickString(obj, [
        'dept_name', 'DEPT_NAME', 'department', 'DEPARTMENT', 'department_name', 'DEPARTMENT_NAME', 'dept'
    ]);
    return dept ?? 'Unknown';
};

const getInitials = (nameOrCode: string): string => {
  const parts = nameOrCode.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  // If it's a code like EMP-00000001, take last 2 meaningful chars
  const letters = nameOrCode.replace(/[^A-Za-z0-9]/g, '');
    const init = letters.slice(-2).toUpperCase();
    return init || 'UN';
};

const palette = [
  'bg-pink-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-rose-500',
];

const getAvatarColor = (key: string): string => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
};

// Helper to format date for the GET /date endpoint (e.g., 10/26/2025)
export const formatDateForAPI = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

type AttendanceListResponse = {
    items: AttendanceListItem[];
    lunchCount: number;
    dinnerCount: number;
    hasMore: boolean;
    limit: number;
    offset: number;
    count: number;
};

export const getDailyAttendance = async (
    dateString: string,
    authToken?: string,
    limit: number = 25,
    offset: number = 0
): Promise<AttendanceListResponse> => {
        // Server expects slashes unencoded (10/16/2025), so avoid URLSearchParams for date
        const url = `${ATTENDANCE_GET_URL}?attendance_date=${dateString}&limit=${limit}&offset=${offset}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` }), 
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API returned non-OK status: ${response.status}. Response: ${errorText.substring(0, 100)}...`);
        }

    const data: { items: ApiAttendanceRecord[]; hasMore?: boolean; limit?: number; offset?: number; count?: number } = await response.json();
        
        let lunchTotal = 0;
        let dinnerTotal = 0;
        
        const processedItems: AttendanceListItem[] = data.items.map(record => {
            const displayName = getDisplayName(record);
            const dept = getDeptName(record);
            const initials = getInitials(displayName);
            const avatarColor = getAvatarColor(record.emp_code);

            const isLunch = record.is_taking_lunch === 1;
            const isDinner = record.is_taking_dinner === 1;

            if (isLunch) lunchTotal++;
            if (isDinner) dinnerTotal++;

            return {
                ...record,
                id: record.attendance_id, 
                initials,
                name: displayName,
                dept,
                avatarColor,
                lunch: isLunch,
                dinner: isDinner,
            };
        });

                return {
                    items: processedItems,
                    lunchCount: lunchTotal,
                    dinnerCount: dinnerTotal,
                    hasMore: Boolean(data.hasMore),
                    limit: typeof data.limit === 'number' ? data.limit : limit,
                    offset: typeof data.offset === 'number' ? data.offset : offset,
                    count: typeof data.count === 'number' ? data.count : processedItems.length,
                };

    } catch (error) {
        console.error("Error fetching daily attendance:", error);
        throw error;
    }
};

export type SaveAttendancePayload = {
    attendance_id: number;
    emp_code: string;
    attendance_date: string; // MM/DD/YYYY
    is_taking_lunch: 0 | 1;
    is_taking_dinner: 0 | 1;
    payment_status: string;
};

export const saveAttendanceBulk = async (payload: SaveAttendancePayload[], authToken?: string) => {
    const url = ATTENDANCE_SAVE_URL;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Save Failed. Status: ${response.status}. Message: ${errorData.message || 'Server Error'}`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("Error saving attendance:", error);
        throw error;
    }
};