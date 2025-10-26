// src/utils/api.ts

const BASE_URL = "https://mailnts.informatixsystems.com:8443/ords/intern/mms1_attendance1";

// --- MOCK EMPLOYEE MASTER DATA ---
const EMPLOYEE_MASTER_MAP: { [key: string]: { initials: string; name: string; dept: string; avatarColor: string } } = {
    'EMP-00000001': { initials: 'SR', name: 'Sara Rahman', dept: 'Software', avatarColor: 'bg-pink-500' },
    'EMP-00000002': { initials: 'JD', name: 'John Doe', dept: 'Software Development', avatarColor: 'bg-red-500' },
    'EMP-00000003': { initials: 'JD', name: 'Jane Doe', dept: 'Development', avatarColor: 'bg-indigo-500' },
    'EMP-00000004': { initials: 'RR', name: 'Reza Rahman', dept: 'Management', avatarColor: 'bg-blue-500' },
    // MOCK MAPPING for the design's 5th record (#005A9C) based on the last 6 chars of the code from the design
    'EMP-343A40': { initials: 'O9', name: '#005A9C', dept: '#343A40', avatarColor: 'bg-orange-500' }, 
};

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

// Helper to format date for the GET /date endpoint (e.g., 10/26/2025)
export const formatDateForAPI = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

export const getDailyAttendance = async (dateString: string, authToken?: string): Promise<{ items: AttendanceListItem[], lunchCount: number, dinnerCount: number }> => {
    const url = `${BASE_URL}/date?attendance_date=${dateString}`;
    
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

        const data: { items: ApiAttendanceRecord[] } = await response.json();
        
        let lunchTotal = 0;
        let dinnerTotal = 0;
        
        const processedItems: AttendanceListItem[] = data.items.map(record => {
            const masterData = EMPLOYEE_MASTER_MAP[record.emp_code] || { initials: record.emp_code.substring(0, 2), name: record.emp_code, dept: 'Unknown', avatarColor: 'bg-gray-500' };
            
            const isLunch = record.is_taking_lunch === 1;
            const isDinner = record.is_taking_dinner === 1;
            
            if (isLunch) lunchTotal++;
            if (isDinner) dinnerTotal++;

            return {
                ...record,
                id: record.attendance_id, 
                initials: masterData.initials,
                name: masterData.name,
                dept: masterData.dept,
                avatarColor: masterData.avatarColor,
                lunch: isLunch,
                dinner: isDinner,
            };
        });

        return { items: processedItems, lunchCount: lunchTotal, dinnerCount: dinnerTotal };

    } catch (error: any) {
        console.error("Error fetching daily attendance:", error);
        throw error; 
    }
};

export const saveAttendanceBulk = async (payload: any[], authToken?: string) => {
    const url = `${BASE_URL}/add`;
    
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

    } catch (error: any) {
        console.error("Error saving attendance:", error);
        throw error;
    }
};