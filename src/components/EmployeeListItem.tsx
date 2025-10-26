// src/components/EmployeeListItem.tsx

import React from 'react'; // Ensure React is imported
import { Switch } from '@headlessui/react'; // Ensure Headless UI is imported

// --- MealToggle Component Definition (Must be defined first) ---
interface CustomToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: 'Lunch' | 'Dinner';
}

const MealToggle: React.FC<CustomToggleProps> = ({ checked, onChange, label }) => {
    // ... (Content of MealToggle component) ...
    const ACCENT_COLOR = 'bg-green-500'; 
    const OFF_COLOR = 'bg-gray-200';

    return (
        <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 w-12 text-right">{label}</span>
            <Switch
                checked={checked}
                onChange={onChange}
                className={`${checked ? ACCENT_COLOR : OFF_COLOR}
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                `}
            >
                <span
                    className={`${checked ? 'translate-x-6' : 'translate-x-1'}
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    `}
                />
            </Switch>
        </div>
    );
};


// --- Helper Function Definition (Moved from inside component body) ---
const getAvatarBgColor = (initials: string, id: number): string => {
    if (initials === 'JD' && id === 1) return 'bg-green-500';
    if (initials === 'JD' && id === 2) return 'bg-red-500';
    if (id === 5) return 'bg-blue-500';
    return 'bg-gray-400';
};


// --- Main Employee List Item Component (Now uses MealToggle) ---
export default function EmployeeListItem({ employee, onToggleLunch, onToggleDinner }: EmployeeListItemProps) {
    // ... (Component logic using isLunch, isDinner, handleLunchToggle, handleDinnerToggle)
    // ... (Using the defined getAvatarBgColor and rendering <MealToggle />)
    
    // Ensure you use the handlers passed via props:
    // ...
    // <MealToggle 
    //     checked={isLunch} 
    //     onChange={handleLunchToggle} // Which calls onToggleLunch from props
    //     label="Lunch" 
    // />
    // ...
}