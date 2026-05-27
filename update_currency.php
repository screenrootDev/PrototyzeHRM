<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use App\Models\Setting;

try {
    // If you use a Settings model
    $setting = Setting::where('name', 'currencySymbol')->first();
    if ($setting) {
        $setting->value = '₹';
        $setting->save();
        echo "Updated currencySymbol in Setting model\n";
    } else {
        Setting::updateOrCreate(['name' => 'currencySymbol'], ['value' => '₹']);
        echo "Created currencySymbol in Setting model\n";
    }

    $settingCode = Setting::where('name', 'currencyCode')->first();
    if ($settingCode) {
        $settingCode->value = 'INR';
        $settingCode->save();
        echo "Updated currencyCode to INR\n";
    } else {
        Setting::updateOrCreate(['name' => 'currencyCode'], ['value' => 'INR']);
        echo "Created currencyCode to INR\n";
    }

    $settingName = Setting::where('name', 'currencyName')->first();
    if ($settingName) {
        $settingName->value = 'Indian Rupee';
        $settingName->save();
        echo "Updated currencyName to Indian Rupee\n";
    } else {
        Setting::updateOrCreate(['name' => 'currencyName'], ['value' => 'Indian Rupee']);
        echo "Created currencyName to Indian Rupee\n";
    }

} catch (\Exception $e) {
    echo "Could not update via Setting model: " . $e->getMessage() . "\n";
}
