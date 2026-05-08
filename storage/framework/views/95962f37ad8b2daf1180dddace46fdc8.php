<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <title><?php if(trim($__env->yieldContent('template_title'))): ?><?php echo $__env->yieldContent('template_title'); ?> | <?php endif; ?> <?php echo e(trans('installer_messages.title')); ?></title>
    <link rel="icon" type="image/png" href="<?php echo e(asset('installer/img/favicon/favicon.png')); ?>" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#e1f3ff',
                            100: '#bce5ff',
                            200: '#7acaff',
                            300: '#38b0ff',
                            400: '#0096ff',
                            500: '#007bff',
                            600: '#0275bd',
                            700: '#005da1',
                            800: '#004a80',
                            900: '#003a66',
                        }
                    },
                    animation: {
                        'fade-in': 'fadeIn 0.5s ease-out',
                        'slide-up': 'slideUp 0.5s ease-out',
                    },
                    keyframes: {
                        fadeIn: {
                            '0%': { opacity: '0' },
                            '100%': { opacity: '1' },
                        },
                        slideUp: {
                            '0%': { transform: 'translateY(10px)', opacity: '0' },
                            '100%': { transform: 'translateY(0)', opacity: '1' },
                        }
                    }
                }
            }
        }
    </script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
    </style>
    <?php echo $__env->yieldContent('style'); ?>
    <script>
        window.Laravel = <?php echo json_encode(['csrfToken' => csrf_token()]); ?>
    </script>
</head>
<body class="bg-[#f0f7ff] min-h-screen font-inter">
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div class="max-w-4xl w-full">
            <!-- Header -->
            <div class="text-center mb-10">
                <h1 class="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight"><?php echo $__env->yieldContent('title'); ?></h1>
                <p class="text-lg text-gray-600"><?php echo e(trans('installer_messages.title')); ?></p>
            </div>

            <!-- Progress Steps -->
            <div class="mb-10 overflow-x-auto pb-4">
                <div class="flex items-center justify-center min-w-max px-4">
                    <?php
                        $steps = [
                            ['route' => 'LaravelInstaller::welcome', 'icon' => 'fas fa-home', 'label' => 'Welcome'],
                            ['route' => 'LaravelInstaller::requirements', 'icon' => 'fas fa-list', 'label' => 'Requirements'],
                            ['route' => 'LaravelInstaller::permissions', 'icon' => 'fas fa-key', 'label' => 'Permissions'],
                            ['route' => 'LaravelInstaller::environment', 'icon' => 'fas fa-cog', 'label' => 'Configuration', 'alt' => ['LaravelInstaller::environmentWizard', 'LaravelInstaller::environmentClassic']],
                            ['route' => 'LaravelInstaller::final', 'icon' => 'fas fa-check', 'label' => 'Complete'],
                        ];
                    ?>

                    <?php $__currentLoopData = $steps; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $index => $step): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <?php
                            $isActive = isActive($step['route']);
                            if (!$isActive && isset($step['alt'])) {
                                foreach($step['alt'] as $altRoute) {
                                    if (isActive($altRoute)) { $isActive = true; break; }
                                }
                            }
                            // Logic to determine if a step is completed (is before the current step)
                            $isCompleted = false;
                            $currentFound = false;
                            foreach($steps as $s) {
                                if (isActive($s['route']) || (isset($s['alt']) && collect($s['alt'])->contains(fn($r) => isActive($r)))) {
                                    $currentFound = true;
                                }
                                if ($s['route'] === $step['route']) {
                                    if (!$currentFound) $isCompleted = true;
                                    break;
                                }
                            }
                        ?>

                        <div class="flex items-center">
                            <div class="flex flex-col items-center">
                                <div class="w-10 h-10 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-sm
                                    <?php echo e($isActive ? 'border-primary-600 bg-primary-600 text-white scale-110 shadow-primary-200' : ($isCompleted ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-200 bg-white text-gray-400')); ?>">
                                    <i class="<?php echo e($step['icon']); ?> text-sm"></i>
                                </div>
                                <span class="mt-2 text-xs font-semibold <?php echo e($isActive ? 'text-primary-700' : ($isCompleted ? 'text-primary-600' : 'text-gray-400')); ?> hidden sm:block"><?php echo e($step['label']); ?></span>
                            </div>
                            <?php if($index < count($steps) - 1): ?>
                                <div class="w-12 sm:w-20 h-1 mx-2 rounded-full transition-all duration-300 <?php echo e($isCompleted ? 'bg-primary-600' : 'bg-gray-200'); ?>"></div>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </div>
            </div>

            <!-- Main Content -->
            <div class="glass-card rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 sm:p-10 animate-slide-up border border-white/40">
                <?php if(session('message')): ?>
                    <div class="mb-8 p-4 bg-primary-50 border border-primary-100 rounded-xl flex items-center animate-fade-in">
                        <i class="fas fa-info-circle text-primary-600 mr-3 text-lg"></i>
                        <p class="text-primary-800 font-medium">
                            <?php if(is_array(session('message'))): ?>
                                <?php echo e(session('message')['message']); ?>

                            <?php else: ?>
                                <?php echo e(session('message')); ?>

                            <?php endif; ?>
                        </p>
                    </div>
                <?php endif; ?>
                
                <?php if(session()->has('errors')): ?>
                    <div class="mb-8 p-5 bg-red-50 border border-red-100 rounded-xl animate-fade-in" id="error_alert">
                        <div class="flex items-start">
                            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-red-600"></i>
                            </div>
                            <div class="flex-1">
                                <h4 class="text-red-900 font-bold mb-1"><?php echo e(trans('installer_messages.forms.errorTitle')); ?></h4>
                                <ul class="text-red-700 space-y-1 text-sm">
                                    <?php $__currentLoopData = $errors->all(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $error): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                        <li class="flex items-center">
                                            <span class="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                                            <?php echo e($error); ?>

                                        </li>
                                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                </ul>
                            </div>
                            <button type="button" class="text-red-400 hover:text-red-600 transition-colors" id="close_alert">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                <?php endif; ?>
                
                <div class="content-container">
                    <?php echo $__env->yieldContent('container'); ?>
                </div>
            </div>
            
            <div class="text-center mt-8 text-gray-400 text-sm">
                &copy; <?php echo e(date('Y')); ?> <?php echo e(config('app.name')); ?> Installer
            </div>
        </div>
    </div>
    
    <?php echo $__env->yieldContent('scripts'); ?>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const closeAlert = document.getElementById('close_alert');
            const errorAlert = document.getElementById('error_alert');
            if (closeAlert && errorAlert) {
                closeAlert.onclick = function() {
                    errorAlert.style.display = 'none';
                };
            }
        });
    </script>
</body>
</html>
<?php /**PATH /Applications/XAMPP/xamppfiles/htdocs/PrototyzeHRM/resources/views/vendor/installer/layouts/master.blade.php ENDPATH**/ ?>