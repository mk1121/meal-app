// src/components/Header.tsx

import { MenuIcon, CalendarIcon } from 'lucide-react';
import { UserIcon } from 'lucide-react'; // Imported from lucide-react in the previous step, re-importing for clarity

// Define styles based on the professional visual style guide
const NAV_HEIGHT_CLASS = "h-16"; // A standard height for mobile headers

export default function Header() {
  return (
    <header 
      className={`flex items-center justify-between px-4 border-b border-gray-200 bg-white ${NAV_HEIGHT_CLASS} sticky top-0 z-10`}
    >
      {/* Left: Hamburger Menu Icon */}
      <button 
        aria-label="Open Navigation Menu"
        className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Center: Screen Title */}
      <h1 className="text-lg font-bold text-gray-800 select-none">
        Daily Attendance
      </h1>

      {/* Right: Profile Avatar Icon */}
      <button 
        aria-label="User Profile"
        className="p-1 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
      >
        {/* Using a simple UserIcon for the avatar placeholder */}
        <UserIcon className="w-8 h-8 p-0.5 border border-gray-300 rounded-full" />
      </button>
    </header>
  );
}