<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@if (trim($__env->yieldContent('template_title')))@yield('template_title') | @endif {{ trans('installer_messages.updater.title') }}</title>
    <link rel="icon" type="image/png" href="{{ asset('installer/img/favicon/favicon.png') }}"/>
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
    @yield('style')
    <script>
        window.Laravel = <?php echo json_encode(['csrfToken' => csrf_token()]); ?>
    </script>
</head>
<body class="bg-blue-400 min-h-screen">
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div class="max-w-4xl w-full">
            <div class="text-center mb-10">
                <h1 class="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">@yield('title')</h1>
                <p class="text-lg text-gray-600">{{ trans('installer_messages.updater.title') }}</p>
            </div>
            
            <div class="mb-10 overflow-x-auto pb-4">
                <div class="flex items-center justify-center min-w-max px-4">
                    <div class="flex items-center {{ isActive('LaravelUpdater::welcome') ? 'text-primary-600' : (isActive('LaravelUpdater::overview') || isActive('LaravelUpdater::final') ? 'text-primary-600' : 'text-gray-400') }}">
                        <div class="w-10 h-10 rounded-full border-2 {{ isActive('LaravelUpdater::welcome') ? 'border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-100' : (isActive('LaravelUpdater::overview') || isActive('LaravelUpdater::final') ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white shadow-sm') }} flex items-center justify-center transition-all duration-300">
                            <i class="fas fa-sync text-sm"></i>
                        </div>
                        <span class="ml-2 text-sm font-semibold {{ isActive('LaravelUpdater::welcome') ? 'text-primary-700' : (isActive('LaravelUpdater::overview') || isActive('LaravelUpdater::final') ? 'text-primary-600' : 'text-gray-400') }} hidden sm:block">Welcome</span>
                    </div>
                    <div class="w-12 sm:w-20 h-1 mx-2 rounded-full {{ isActive('LaravelUpdater::overview') || isActive('LaravelUpdater::final') ? 'bg-primary-600' : 'bg-gray-200' }} transition-all duration-300"></div>
                    <div class="flex items-center {{ isActive('LaravelUpdater::overview') ? 'text-primary-600' : (isActive('LaravelUpdater::final') ? 'text-primary-600' : 'text-gray-400') }}">
                        <div class="w-10 h-10 rounded-full border-2 {{ isActive('LaravelUpdater::overview') ? 'border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-100' : (isActive('LaravelUpdater::final') ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white shadow-sm') }} flex items-center justify-center transition-all duration-300">
                            <i class="fas fa-list text-sm"></i>
                        </div>
                        <span class="ml-2 text-sm font-semibold {{ isActive('LaravelUpdater::overview') ? 'text-primary-700' : (isActive('LaravelUpdater::final') ? 'text-primary-600' : 'text-gray-400') }} hidden sm:block">Overview</span>
                    </div>
                    <div class="w-12 sm:w-20 h-1 mx-2 rounded-full {{ isActive('LaravelUpdater::final') ? 'bg-primary-600' : 'bg-gray-200' }} transition-all duration-300"></div>
                    <div class="flex items-center {{ isActive('LaravelUpdater::final') ? 'text-primary-600' : 'text-gray-400' }}">
                        <div class="w-10 h-10 rounded-full border-2 {{ isActive('LaravelUpdater::final') ? 'border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-100' : 'border-gray-200 bg-white shadow-sm' }} flex items-center justify-center transition-all duration-300">
                            <i class="fas fa-check text-sm"></i>
                        </div>
                        <span class="ml-2 text-sm font-semibold {{ isActive('LaravelUpdater::final') ? 'text-primary-700' : 'text-gray-400' }} hidden sm:block">Complete</span>
                    </div>
                </div>
            </div>

            <div class="glass-card rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 sm:p-10 animate-slide-up border border-white/40">
                @yield('container')
            </div>

            <div class="text-center mt-8 text-gray-400 text-sm">
                &copy; {{ date('Y') }} {{ config('app.name') }} Updater
            </div>
        </div>
    </div>
    @yield('scripts')
</body>
</html>