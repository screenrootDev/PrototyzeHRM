<?php $__env->startSection('title', trans('installer_messages.updater.final.title')); ?>
<?php $__env->startSection('container'); ?>
    <div class="text-center">
        <div class="mb-8">
            <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-check text-3xl text-green-600"></i>
            </div>
            <h2 class="text-2xl font-semibold text-gray-900 mb-2">Update Completed Successfully!</h2>
            <p class="text-gray-600"><?php echo e(session('message')['message']); ?></p>
        </div>

        <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div class="flex items-center justify-center">
                <i class="fas fa-check-circle text-green-600 mr-2"></i>
                <span class="text-green-800 font-medium">Your application has been updated successfully!</span>
            </div>
        </div>
        
        <a href="<?php echo e(url('/')); ?>" class="inline-flex items-center px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200">
            <i class="fas fa-home mr-2"></i>
            <?php echo e(trans('installer_messages.updater.final.exit')); ?>

        </a>
    </div>
<?php $__env->stopSection(); ?>
<?php echo $__env->make('vendor.installer.layouts.master-update', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Applications/XAMPP/xamppfiles/htdocs/PrototyzeHRM/resources/views/vendor/installer/update/finished.blade.php ENDPATH**/ ?>