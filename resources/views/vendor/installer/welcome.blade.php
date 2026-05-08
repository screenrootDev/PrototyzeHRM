@extends('vendor.installer.layouts.master')

@section('template_title')
    {{ trans('installer_messages.welcome.templateTitle') }}
@endsection

@section('title')
    {{ trans('installer_messages.welcome.title') }}
@endsection

@section('container')
    <div class="text-center animate-slide-up">
        <div class="mb-10">
            <div class="w-24 h-24 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm rotate-3 transition-transform hover:rotate-0">
                <i class="fas fa-rocket text-4xl text-primary-600"></i>
            </div>
            <h2 class="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Welcome to the Installation Wizard</h2>
            <p class="text-gray-600 max-w-md mx-auto leading-relaxed text-lg">
                {{ trans('installer_messages.welcome.message') }}
            </p>
        </div>
        
        <div class="space-y-8">
            <div class="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                <h3 class="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">What we'll set up:</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div class="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                        <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-check text-primary-600"></i>
                        </div>
                        <span class="font-medium">System Requirements</span>
                    </div>
                    <div class="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                        <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-check text-primary-600"></i>
                        </div>
                        <span class="font-medium">File Permissions</span>
                    </div>
                    <div class="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                        <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-check text-primary-600"></i>
                        </div>
                        <span class="font-medium">Database Configuration</span>
                    </div>
                    <div class="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                        <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-check text-primary-600"></i>
                        </div>
                        <span class="font-medium">Application Setup</span>
                    </div>
                </div>
            </div>
            
            <div class="flex justify-center pt-4">
                <a href="{{ route('LaravelInstaller::requirements') }}" class="group relative inline-flex items-center px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-primary-200 hover:shadow-primary-300 hover:-translate-y-1">
                    {{ trans('installer_messages.welcome.next') }}
                    <i class="fas fa-arrow-right ml-3 group-hover:translate-x-1 transition-transform"></i>
                </a>
            </div>
        </div>
    </div>
@endsection
