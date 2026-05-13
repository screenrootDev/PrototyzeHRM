<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$kernel->bootstrap();

$router = $app->make('router');
foreach ($router->getRoutes() as $route) {
    if ($route->getName() === 'impersonate.start') {
        echo "Middlewares for impersonate.start:\n";
        print_r($route->gatherMiddleware());
    }
}
