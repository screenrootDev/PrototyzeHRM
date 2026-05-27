<?php

use Illuminate\Support\Facades\DB;

try {
    $roles = DB::table('roles')->get();
    echo "<h2>All Roles in DB:</h2><ul>";
    foreach ($roles as $role) {
        echo "<li>ID: {$role->id}, Name: {$role->name}, Slug: " . ($role->slug ?? 'N/A') . "</li>";
    }
    echo "</ul>";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
