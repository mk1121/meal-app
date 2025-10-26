// src/components/EmployeeListItem.tsx

import { useCallback, useState } from 'react';
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
        <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 w-12 text-right">{label}</span>
            <Switch
                checked={checked}
                onChange={onChange}
                className={`${checked ? ACCENT : OFF} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
            >
                <span
                    className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
            </Switch>
        </div>
    );
};

export default function EmployeeListItem({ employee, onToggleLunch, onToggleDinner }: EmployeeListItemProps) {
    const [lunch, setLunch] = useState<boolean>(employee.lunch);
    const [dinner, setDinner] = useState<boolean>(employee.dinner);

    const handleLunch = useCallback(
        (val: boolean) => {
            setLunch(val);
            onToggleLunch(employee.id, val);
        },
        [employee.id, onToggleLunch]
    );

    const handleDinner = useCallback(
        (val: boolean) => {
            setDinner(val);
            onToggleDinner(employee.id, val);
        },
        [employee.id, onToggleDinner]
    );

    return (
        <div className="p-3 flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${employee.avatarColor}`}>
                    {employee.initials}
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-800 font-medium">{employee.name}</span>
                    <span className="text-gray-500 text-sm">{employee.dept}</span>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <Toggle checked={lunch} onChange={handleLunch} label="Lunch" />
                <Toggle checked={dinner} onChange={handleDinner} label="Dinner" />
            </div>
        </div>
    );
}