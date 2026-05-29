<?php
$pidFile = '/Applications/XAMPP/xamppfiles/var/mysql/chetans-MacBook-Pro.local.pid';
if (file_exists($pidFile)) {
    unlink($pidFile);
    echo "<h1>Stale PID file deleted!</h1>";
    echo "<p>Please go to your XAMPP Control Panel and start MySQL Database again. It should stay green this time.</p>";
} else {
    echo "<h1>PID file not found.</h1>";
    echo "<p>MySQL might be experiencing a different issue. Please check the XAMPP Control Panel again.</p>";
}
