<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\AddOn;

class AddOnSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $modules = [
            ['id' => 'meetings', 'label' => 'Meetings', 'icon' => 'MessageCircle', 'color' => 'text-blue-500'],
            ['id' => 'recruitment', 'label' => 'Recruitment', 'icon' => 'UsersRound', 'color' => 'text-indigo-500'],
            ['id' => 'assets', 'label' => 'Asset Management', 'icon' => 'Package', 'color' => 'text-emerald-500'],
            ['id' => 'training', 'label' => 'Training', 'icon' => 'GraduationCap', 'color' => 'text-amber-500'],
            ['id' => 'contracts', 'label' => 'Contract Management', 'icon' => 'Clipboard', 'color' => 'text-rose-500'],
            ['id' => 'documents', 'label' => 'Document Management', 'icon' => 'FolderOpen', 'color' => 'text-cyan-500'],
            ['id' => 'leave', 'label' => 'Leave Management', 'icon' => 'CalendarRange', 'color' => 'text-orange-500'],
            ['id' => 'attendance', 'label' => 'Attendance', 'icon' => 'UserCheck', 'color' => 'text-purple-500'],
            ['id' => 'performance', 'label' => 'Performance', 'icon' => 'Target', 'color' => 'text-pink-500'],
            ['id' => 'biometric', 'label' => 'Biometric Attendance', 'icon' => 'Fingerprint', 'color' => 'text-teal-500'],
            ['id' => 'time_tracking', 'label' => 'Time Tracking', 'icon' => 'Timer', 'color' => 'text-sky-500'],
            ['id' => 'payroll', 'label' => 'Payroll Management', 'icon' => 'IndianRupee', 'color' => 'text-emerald-600'],
        ];

        foreach ($modules as $module) {
            AddOn::updateOrCreate(
                ['module' => $module['id']],
                [
                    'name' => $module['label'],
                    'label' => $module['label'],
                    'icon' => $module['icon'],
                    'color' => $module['color'],
                    'is_enable' => true,
                    'monthly_price' => 0,
                    'yearly_price' => 0,
                ]
            );
        }
    }
}
