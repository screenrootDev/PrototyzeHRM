<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    $updated = DB::table('settings')->where('key', 'defaultTimezone')->update(['value' => 'Asia/Kolkata']);
    echo "DB Updated: " . ($updated ? 'Yes' : 'No') . "\n";
} catch (\Exception $e) {
    echo "DB Update Error: " . $e->getMessage() . "\n";
}
