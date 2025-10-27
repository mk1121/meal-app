// src/components/Header.tsx
"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MenuIcon, X as XIcon, ClipboardList, UtensilsCrossed, Settings } from 'lucide-react';
import { UserIcon } from 'lucide-react';

// Define styles based on the professional visual style guide
const NAV_HEIGHT_CLASS = "h-16"; // A standard height for mobile headers

export default function Header({ title = 'Daily Attendance' }: { title?: string }) {
  const [open, setOpen] = useState(false);
  const menuId = 'app-mobile-menu';

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  return (
    <header className={`sticky top-0 z-20 bg-white border-b border-gray-200 ${NAV_HEIGHT_CLASS}`}>
      <div className="flex items-center justify-between px-4 h-full">
        {/* Left: Hamburger */}
        <button
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen(v => !v)}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {open ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>

        {/* Center: Title */}
        <h1 className="text-lg font-bold text-gray-800 select-none">{title}</h1>

        {/* Right: Avatar */}
        <button aria-label="User Profile" className="p-1 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <UserIcon className="w-8 h-8 p-0.5 border border-gray-300 rounded-full" />
        </button>
      </div>

      {/* Overlay + Menu (rendered only when open) */}
      {open && (
        <>
          <button
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40 lg:bg-black/20"
          />

          {/* Responsive menu content */}
          <div
            id={menuId}
            className={`fixed z-50 transition-transform duration-200 ease-out translate-y-0 top-0 left-0 right-0 h-full`}
            aria-hidden={!open}
          >
        {/* Small/Medium: Fullscreen grid of cards */}
        <div className={`lg:hidden ${open ? 'block' : 'hidden'}`}>
          <div className="h-dvh w-full bg-white pt-16 px-4 relative">
            {/* Explicit close inside fullscreen menu */}
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 shadow-sm"
            >
              <XIcon className="w-6 h-6" />
            </button>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/attendance" onClick={() => setOpen(false)} className="rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col items-center justify-center active:scale-[0.98]">
                <ClipboardList className="w-8 h-8 text-gray-700 mb-2" />
                <span className="text-sm font-medium text-gray-800">Daily Attendance</span>
              </Link>
              <Link href="/expenses" onClick={() => setOpen(false)} className="rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col items-center justify-center active:scale-[0.98]">
                <UtensilsCrossed className="w-8 h-8 text-gray-700 mb-2" />
                <span className="text-sm font-medium text-gray-800">Daily Expenses</span>
              </Link>
              <Link href="#" onClick={() => setOpen(false)} className="rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col items-center justify-center active:scale-[0.98]">
                <Settings className="w-8 h-8 text-gray-700 mb-2" />
                <span className="text-sm font-medium text-gray-800">Settings</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Large: Left side panel ~25% width with vertical list */}
        <div className={`hidden lg:flex h-full`}> 
          <div className="bg-white h-full w-[25vw] max-w-sm border-r border-gray-200 shadow-xl pt-20 px-4 relative">
            {/* Close for large side panel */}
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 shadow-sm"
            >
              <XIcon className="w-5 h-5" />
            </button>
            <nav className="space-y-2">
              <Link href="/attendance" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 active:bg-gray-100">
                <ClipboardList className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-800">Daily Attendance</span>
              </Link>
              <Link href="/expenses" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 active:bg-gray-100">
                <UtensilsCrossed className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-800">Daily Expenses</span>
              </Link>
              <Link href="#" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 active:bg-gray-100">
                <Settings className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-800">Settings</span>
              </Link>
            </nav>
          </div>
        </div>
          </div>
        </>
      )}
    </header>
  );
}