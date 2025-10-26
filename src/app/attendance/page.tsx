// src/app/attendance/page.tsx
'use client'; 

import { CalendarIcon, Loader2Icon, ClipboardListIcon } from 'lucide-react';
import Header from '@/components/Header';
import EmployeeListItem from '@/components/EmployeeListItem';
import SaveFAB from '@/components/SaveFAB';
import { useState, useEffect, useCallback } from 'react';
import { getDailyAttendance, saveAttendanceBulk, AttendanceListItem } from '@/utils/api'; 

// --- Helper to format date for API (Adjust as necessary for your actual system date needs) ---
const formatDateForAPIMock = (dateLabel: string): string => {
    // MOCK: If the label says "October 26", we use the format the API expects ("10/26/2025")
    if (dateLabel.includes("October 26")) return "10/26/2025"; 
    if (dateLabel.includes("October 27")) return "10/27/2025";
    return "10/26/2025"; // Default
};

// --- MOCK AUTH TOKEN ---
const MOCK_AUTH_TOKEN = 'YOUR_SECRET_ORDS_TOKEN_HERE'; // <<< IMPORTANT: REPLACE THIS with actual token/session logic

export default function DailyAttendancePage() {
  
  const [currentDateLabel, setCurrentDateLabel] = useState("Today, October 26");
  const [employees, setEmployees] = useState<AttendanceListItem[]>([]);
  const [lunchCount, setLunchCount] = useState(0);
  const [dinnerCount, setDinnerCount] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Function to fetch data, called when date changes
  const loadData = useCallback(async (dateLabel: string, token?: string) => {
    setIsLoading(true);
    const apiDate = formatDateForAPIMock(dateLabel); 
    try {
      const data = await getDailyAttendance(apiDate, token);
      setEmployees(data.items);
      setLunchCount(data.lunchCount);
      setDinnerCount(data.dinnerCount);
      setToastMessage(null); 
    } catch (error: any) {
      console.error("Failed to load data:", error);
      setEmployees([]);
      setToastMessage({ message: `Load Error: ${error.message.substring(0, 50)}...`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(currentDateLabel, MOCK_AUTH_TOKEN);
  }, [currentDateLabel, loadData]);

  // Handler to update state when a toggle is flipped
  const handleAttendanceUpdate = (id: number, mealType: 'lunch' | 'dinner', isChecked: boolean) => {
    setEmployees(prevEmployees => 
      prevEmployees.map(emp => 
        emp.id === id ? { ...emp, [mealType]: isChecked } : emp
      )
    );
  };

  // Handler for the Save FAB
  const handleSave = async () => {
    if (isLoading || isSaving || employees.length === 0) return;

    setIsSaving(true);
    
    const payload = employees.map(emp => ({
        attendance_id: emp.id,
        emp_code: emp.emp_code, // Use the emp_code from the fetched record!
        attendance_date: formatDateForAPIMock(currentDateLabel),
        is_taking_lunch: emp.lunch ? 1 : 0,
        is_taking_dinner: emp.dinner ? 1 : 0,
        payment_status: "Pending_Update",
    }));
    
    try {
        const result = await saveAttendanceBulk(payload, MOCK_AUTH_TOKEN);
        setToastMessage({ message: `Save Success! ${result.message}`, type: 'success' });
        
        // Re-fetch data to confirm save and get fresh counts
        loadData(currentDateLabel, MOCK_AUTH_TOKEN); 

    } catch (error: any) {
        setToastMessage({ message: `Save Failed: ${error.message}`, type: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  // --- Conditional Rendering Blocks ---
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
              <button 
                aria-label="Open Calendar"
                className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <CalendarIcon className="w-6 h-6" />
              </button>
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