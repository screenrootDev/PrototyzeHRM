<?php

namespace App\Http\Controllers;

use App\Models\AddOn;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AddOnController extends Controller
{
    public function index()
    {
        $addOns = AddOn::orderBy('name')->get();
        return Inertia::render('superadmin/addons/index', [
            'addOns' => $addOns,
        ]);
    }

    public function toggle(Request $request, $id)
    {
        $addOn = AddOn::findOrFail($id);
        
        $request->validate([
            'is_enable' => 'required|boolean',
        ]);

        $addOn->update([
            'is_enable' => $request->is_enable
        ]);

        $status = $addOn->is_enable ? 'enabled' : 'disabled';
        return redirect()->back()->with('success', "Add-on successfully {$status}.");
    }

    public function upload()
    {
        return Inertia::render('superadmin/addons/upload');
    }

    public function install(Request $request)
    {
        // Mock install process
        return redirect()->route('addons.index')->with('success', 'Add-ons installed successfully.');
    }
}
