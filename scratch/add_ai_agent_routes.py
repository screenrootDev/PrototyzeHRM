filepath = 'routes/settings.php'
with open(filepath, 'r') as f:
    content = f.read()

target = "Route::post('settings/chatgpt', [SystemSettingsController::class, 'updateChatgpt'])->name('settings.chatgpt.update');"
addition = """    Route::post('settings/ai-agent', [SystemSettingsController::class, 'updateAIAgentSettings'])->name('settings.ai-agent.update');
    Route::get('settings/ai-agent/providers', [SystemSettingsController::class, 'getAIAgentProviders'])->name('settings.ai-agent.providers');
"""

if "settings.ai-agent.update" not in content:
    content = content.replace(target, addition + target)

with open(filepath, 'w') as f:
    f.write(content)

print("Updated routes/settings.php")
