// src/app/attendance/page.tsx

'use client'; 

import { CalendarIcon, ClipboardListIcon } from 'lucide-react';
import Header from '@/components/Header';
import EmployeeListItem from '@/components/EmployeeListItem';
import SaveFAB from '@/components/SaveFAB';
import { useState, useEffect, useCallback } from 'react';
import { getDailyAttendance, saveAttendanceBulk, AttendanceListItem } from '@/utils/api'; 

// --- Helper to format date for API (Crucial for API connection) ---
// Formats JS Date object into MM/DD/YYYY string expected by GET /date endpoint
const formatDateForAPI = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

// Format Date for input[type="date"] (YYYY-MM-DD)
const formatDateForInput = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Human-friendly label for header
const formatHumanLabel = (date: Date): string => {
  const today = new Date();
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  if (isSameDay) {
    return `Today, ${today.toLocaleString('default', { month: 'long', day: 'numeric' })}`;
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

// --- Auth Token ---
// Use public env var for client-side requests; if not set, requests will go without Authorization header.
const AUTH_TOKEN = process.env.NEXT_PUBLIC_ORDS_TOKEN;

export default function DailyAttendancePage() {
  
  // State for the date picker control
  const [currentDateLabel, setCurrentDateLabel] = useState<string>(""); // Start empty, set in useEffect
  const [currentDateObj, setCurrentDateObj] = useState<Date>(new Date()); // Holds the actual Date object
  
  // State for data fetched from API
  const [employees, setEmployees] = useState<AttendanceListItem[]>([]);
  const [lunchCount, setLunchCount] = useState(0);
  const [dinnerCount, setDinnerCount] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  // Pagination
  const [limit, setLimit] = useState<number>(25);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  // Note: pageCount not required in UI now; omit to keep linter happy

  // Function to fetch data, called when date changes
  const loadData = useCallback(async (dateObj: Date, token?: string, nextOffset?: number) => {
    setIsLoading(true);
    const apiDateString = formatDateForAPI(dateObj); // Use the helper to format the real date
    
    try {
      // The mock API logic in api.ts needs adjustment to handle a real date string, 
      // as it currently only returns data for "October 26".
      // For now, we'll just pass the formatted string and rely on the mock to return *something*.
  const effOffset = typeof nextOffset === 'number' ? nextOffset : offset;
  const data = await getDailyAttendance(apiDateString, token, limit, effOffset); 
      
      setEmployees(data.items);
      setLunchCount(data.lunchCount);
      setDinnerCount(data.dinnerCount);
      setHasMore(data.hasMore);
      setOffset(data.offset);
      setLimit(data.limit);
      setToastMessage(null); 
    } catch (error) {
      console.error("Failed to load data:", error);
      setEmployees([]);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setToastMessage({ message: `Load Error: ${msg.substring(0, 50)}...`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset]);

  // We want this to run only once on mount; loadData identity changes with offset/limit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // 1. Set the UI Label based on the current date object
    const today = new Date();
    setCurrentDateLabel(formatHumanLabel(today));
    setCurrentDateObj(today);
    
    // 2. Load data for today's date
    loadData(today, AUTH_TOKEN, 0);
  }, []);

  // Handler to update state when a toggle is flipped
  const handleAttendanceUpdate = (id: number, mealType: 'lunch' | 'dinner', isChecked: boolean) => {
    setEmployees(prevEmployees => {
      const next = prevEmployees.map(emp =>
        emp.id === id ? { ...emp, [mealType]: isChecked } : emp
      );
      // recalc counts so summary updates immediately
      const l = next.reduce((acc, e) => acc + (e.lunch ? 1 : 0), 0);
      const d = next.reduce((acc, e) => acc + (e.dinner ? 1 : 0), 0);
      setLunchCount(l);
      setDinnerCount(d);
      return next;
    });
  };

  // Handler for the Save FAB (Keep the logic the same, but ensure currentDateLabel is used)
  const handleSave = async () => {
    if (isLoading || isSaving || employees.length === 0) return;

    setIsSaving(true);
    
    // ORDS কলামে PAYMENT_STATUS এর max length 10; এখানে ভ্যালু স্যানিটাইজ করি
    const normalizePaymentStatus = (status: string | undefined): string => {
      const raw = (status || '').trim().toLowerCase();
      if (raw.startsWith('paid')) return 'Paid';
      if (raw.startsWith('unpaid')) return 'Unpaid';
      if (raw.startsWith('pending')) return 'Pending';
      // অজানা হলে ফাঁকা বা কাটছাঁট
      const capped = (status || '').trim().slice(0, 10);
      return capped || 'Pending';
    };
    
    const payload = employees.map(emp => ({
        attendance_id: emp.id,
        emp_code: emp.emp_code,
        attendance_date: formatDateForAPI(currentDateObj), // Use the Date Object for consistency
  is_taking_lunch: (emp.lunch ? 1 : 0) as 0 | 1,
  is_taking_dinner: (emp.dinner ? 1 : 0) as 0 | 1,
        // আগের মান থাকলে সেটাই ব্যবহার, না থাকলে 'Pending'; ১০ অক্ষরের মধ্যে রাখা বাধ্যতামূলক
        payment_status: normalizePaymentStatus(emp.payment_status),
    }));
    
    try {
    const result = await saveAttendanceBulk(payload, AUTH_TOKEN);
        setToastMessage({ message: `Save Success! ${result.message}`, type: 'success' });
        
  loadData(currentDateObj, AUTH_TOKEN, offset); 

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    setToastMessage({ message: `Save Failed: ${msg}`, type: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  // --- Conditional Rendering Blocks (Remain the same) ---
  const renderLoadingState = () => (
    <div className="space-y-3 pt-4 animate-pulse">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="p-3 flex items-center justify-between bg-white rounded-xl shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            <div className="flex flex-col space-y-1">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-100 rounded w-20"></div>
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="h-6 w-11 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-11 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center p-10 bg-white rounded-xl shadow-sm mt-6 border border-gray-200">
      <ClipboardListIcon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
      <h4 className="text-lg font-semibold text-gray-700 mb-1">No attendance data found</h4>
      <p className="text-sm text-gray-500">
        No records were returned for this date from the API.
      </p>
    </div>
  );

  const renderDataList = () => (
    <div className="space-y-3">
      {employees.map((employee) => (
        <EmployeeListItem 
          key={employee.id} 
          employee={employee} 
          onToggleLunch={(id, checked) => handleAttendanceUpdate(id, 'lunch', checked)}
          onToggleDinner={(id, checked) => handleAttendanceUpdate(id, 'dinner', checked)}
        />
      ))}
    </div>
  );


  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md bg-gray-50 relative">

        <Header />

        <main className="p-4 space-y-6">
          <section>
            {/* Date Picker */}
            <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-medium text-gray-800">
                {currentDateLabel}
              </h2>
              <label className="flex items-center space-x-2 text-blue-700">
                <CalendarIcon className="w-5 h-5" />
                <input
                  type="date"
                  aria-label="Pick a date"
                  className="border border-blue-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formatDateForInput(currentDateObj)}
                  onChange={(e) => {
                    const val = e.target.value; // yyyy-mm-dd
                    if (!val) return;
                    const [yy, mm, dd] = val.split('-').map((n) => Number(n));
                    const chosen = new Date(yy, (mm || 1) - 1, dd || 1);
                    setCurrentDateObj(chosen);
                    setCurrentDateLabel(formatHumanLabel(chosen));
                    loadData(chosen, AUTH_TOKEN, 0);
                  }}
                />
              </label>
            </div>

            {/* Quick Summary Stats */}
            <div className="flex space-x-3">
              <div className="flex-1 flex items-center justify-center p-3 border border-green-300 bg-green-50 rounded-xl shadow-sm">
                <span role="img" aria-label="Lunch Icon" className="mr-2 text-lg">🏃</span>
                <span className="font-bold text-green-700">Lunch: {lunchCount}</span>
              </div>
              <div className="flex-1 flex items-center justify-center p-3 border border-gray-300 bg-white rounded-xl shadow-sm">
                <span role="img" aria-label="Dinner Icon" className="mr-2 text-lg">👤</span>
                <span className="font-bold text-gray-700">Dinner: {dinnerCount}</span>
              </div>
            </div>
          </section>

          {/* Employee List Content Area */}
          <section className="pb-24">
            {isLoading ? (
              renderLoadingState()
            ) : employees.length === 0 ? (
              renderEmptyState()
            ) : (
              renderDataList()
            )}
            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <button
                className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                onClick={() => loadData(currentDateObj, AUTH_TOKEN, Math.max(0, offset - limit))}
                disabled={isLoading || offset === 0}
              >
                Prev
              </button>
              <div>
                <span>Showing {employees.length} • Offset {offset}</span>
              </div>
              <button
                className="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                onClick={() => loadData(currentDateObj, AUTH_TOKEN, offset + limit)}
                disabled={isLoading || !hasMore}
              >
                Next
              </button>
            </div>
          </section>
        </main>

        {/* 4. Primary Action Button (FAB) */}
        <SaveFAB 
            onSave={handleSave} 
            isSaving={isSaving} 
            toastMessage={toastMessage} 
            setToastMessage={setToastMessage} 
        />
      </div>
    </div>
  );
}