// src/components/SaveFAB.tsx

import { CheckIcon } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react'; // <-- ADDED useEffect HERE

interface SaveFABProps {
    onSave: () => void;
    isSaving: boolean;
    toastMessage: { message: string, type: 'success' | 'error' } | null;
    setToastMessage: React.Dispatch<React.SetStateAction<{ message: string, type: 'success' | 'error' } | null>>;
}

export default function SaveFAB({ onSave, isSaving, toastMessage, setToastMessage }: SaveFABProps) {
  
  // Use useMemo to prevent unnecessary re-renders of the button if props don't change
  const buttonClasses = useMemo(() => 
    isSaving 
      ? "bg-gray-600 text-white cursor-not-allowed opacity-80"
      : "bg-gray-900 hover:bg-black text-white hover:scale-[1.02]"
  , [isSaving]);
    
  const handleSaveClick = () => {
    if (!isSaving) {
        onSave();
    }
  };

  // Auto-hide toast message
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000); // Show message for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [toastMessage, setToastMessage]);

  // Styling for the small floating checkmark
  const successCheckmarkClasses = `
    fixed bottom-16 right-[70px] text-white transition-opacity duration-300 z-30
    ${toastMessage?.type === 'success' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
  `;

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={handleSaveClick}
        disabled={isSaving}
        aria-label={isSaving ? "Saving..." : "Save Attendance"}
        className={`fixed bottom-6 right-6 p-4 rounded-2xl shadow-xl transition-all duration-300 transform flex items-center justify-center w-28 h-14 ${buttonClasses}`}
      >
        {isSaving ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <>
            <CheckIcon className="w-5 h-5 mr-2" />
            <span className="font-semibold text-base">Save</span>
          </>
        )}
      </button>

      {/* Confirmation Checkmark (Toast Mimic) */}
      <div className={successCheckmarkClasses} aria-live="assertive">
        <div className="bg-green-500 p-2 rounded-full shadow-xl border-2 border-white">
          <CheckIcon className="w-6 h-6" />
        </div>
      </div>
    </>
  );
}