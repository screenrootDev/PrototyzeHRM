<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DefaultCompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Standalone HR: Only one company
        $companiesToCreate = [[
            'name' => 'Company',
            'email' => 'company@example.com',
            'lang' => 'en',
        ]];

        foreach ($companiesToCreate as $companyData) {
            // Skip if user already exists
            if (User::where('email', $companyData['email'])->exists()) {
                continue;
            }

            // Create company user
            $user = User::create([
                'name' => $companyData['name'],
                'email' => $companyData['email'],
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'type' => 'company',
                'lang' => $companyData['lang'],
                'created_at' => now(),
            ]);

            // Assign company role
            $user->assignRole('company');

            // Create default settings
            if (!Setting::where('user_id', $user->id)->exists()) {
                copySettingsFromSuperAdmin($user->id);
            }
        }

        $this->command->info('Created ' . count($companiesToCreate) . ' default companies successfully!');
    }
}
