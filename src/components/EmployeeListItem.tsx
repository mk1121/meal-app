// src/components/EmployeeListItem.tsx

import { useCallback } from 'react';
import { Switch } from '@headlessui/react';
import type { AttendanceListItem } from '@/utils/api';

type EmployeeListItemProps = {
    employee: AttendanceListItem;
    onToggleLunch: (id: number, checked: boolean) => void;
    onToggleDinner: (id: number, checked: boolean) => void;
};

const Toggle = ({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (val: boolean) => void;
    label: 'Lunch' | 'Dinner';
}) => {
    const ACCENT = 'bg-green-500';
    const OFF = 'bg-gray-200';
    return (
        <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm text-gray-600 w-10 sm:w-12 text-right">{label}</span>
            <Switch
                checked={checked}
                onChange={onChange}
                className={`${checked ? ACCENT : OFF} relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 h-4 w-8 sm:h-5 sm:w-9 md:h-5 md:w-10 lg:h-6 lg:w-11`}
            >
                <span
                    className={`${checked ? 'translate-x-4 sm:translate-x-5 lg:translate-x-6' : 'translate-x-1'} inline-block transform rounded-full bg-white transition-transform h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4`}
                />
            </Switch>
        </div>
    );
};

export default function EmployeeListItem({ employee, onToggleLunch, onToggleDinner }: EmployeeListItemProps) {
    const handleLunch = useCallback(
        (val: boolean) => {
            onToggleLunch(employee.id, val);
        },
        [employee.id, onToggleLunch]
    );

    const handleDinner = useCallback(
        (val: boolean) => {
            onToggleDinner(employee.id, val);
        },
        [employee.id, onToggleDinner]
    );

    return (
        <div className="p-2 sm:p-2 md:p-2 lg:p-3 flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm ${employee.avatarColor}`}>
                    {employee.initials}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-gray-800 font-medium text-sm sm:text-[15px] lg:text-base truncate">{employee.name}</span>
                    <span className="text-gray-500 text-xs sm:text-sm truncate">{employee.dept}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
                <Toggle checked={employee.lunch} onChange={handleLunch} label="Lunch" />
                <Toggle checked={employee.dinner} onChange={handleDinner} label="Dinner" />
            </div>
        </div>
    );
}