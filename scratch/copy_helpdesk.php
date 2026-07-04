<?php

$sourceBase = '/Applications/XAMPP/xamppfiles/htdocs/erp';
$targetBase = '/Applications/XAMPP/xamppfiles/htdocs/PrototyzeHRM';

function copyFiles($sourceDir, $targetDir, $match = '') {
    if (!is_dir($sourceDir)) return;
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0777, true);
    }
    
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($sourceDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    
    foreach ($iterator as $item) {
        $relPath = $iterator->getSubPathname();
        
        if ($match && stripos($relPath, $match) === false) {
            continue;
        }
        
        $target = $targetDir . DIRECTORY_SEPARATOR . $relPath;
        
        if ($item->isDir()) {
            if (!is_dir($target)) {
                mkdir($target, 0777, true);
            }
        } else {
            // make sure target dir exists
            $dir = dirname($target);
            if (!is_dir($dir)) {
                mkdir($dir, 0777, true);
            }
            copy($item->getPathname(), $target);
            echo "Copied: $relPath\n";
        }
    }
}

// 1. Migrations
echo "Copying Migrations...\n";
copyFiles("$sourceBase/database/migrations", "$targetBase/database/migrations", "helpdesk");

// 2. Models
echo "\nCopying Models...\n";
copyFiles("$sourceBase/app/Models", "$targetBase/app/Models", "Helpdesk");

// 3. Controllers
echo "\nCopying Controllers...\n";
copyFiles("$sourceBase/app/Http/Controllers", "$targetBase/app/Http/Controllers", "Helpdesk");

// 4. Requests
echo "\nCopying Requests...\n";
copyFiles("$sourceBase/app/Http/Requests", "$targetBase/app/Http/Requests", "Helpdesk");

// 5. Events
echo "\nCopying Events...\n";
copyFiles("$sourceBase/app/Events", "$targetBase/app/Events", "Helpdesk");

// 6. Frontend
echo "\nCopying Frontend Pages...\n";
if (!is_dir("$targetBase/resources/js/pages/Helpdesk")) {
    mkdir("$targetBase/resources/js/pages/Helpdesk", 0777, true);
}
// For frontend we want all files in Helpdesk directory
$cmd = "cp -r $sourceBase/resources/js/pages/Helpdesk/* $targetBase/resources/js/pages/Helpdesk/";
exec($cmd);
echo "Frontend pages copied.\n";

echo "\nMigration of files complete.\n";
