<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use App\Models\Media;

try {
    $deleted = Media::whereIn('file_name', [
        'company-logo.png', 
        'company-office-photo.png', 
        'company-business-card.png', 
        'company-letterhead.png', 
        'company-team-photo.png', 
        'company-building-exterior.png', 
        'company-social-banner.png'
    ])->delete();
    
    echo "Deleted {$deleted} placeholder records.";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
