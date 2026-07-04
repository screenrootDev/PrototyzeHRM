import re

with open('routes/web.php', 'r') as f:
    content = f.read()

imports = """
use App\\Http\\Controllers\\AIAgentChatPageController;
use App\\Http\\Controllers\\AIAgentChatController;
"""

routes = """
    // AI Agent routes
    Route::prefix('ai-agent')->name('ai-agent.')->group(function () {
        Route::get('/chat-page', [AIAgentChatPageController::class, 'index'])->name('chat.page');
        Route::post('/chat', [AIAgentChatController::class, 'chat'])->name('chat');
        Route::get('/sessions', [AIAgentChatPageController::class, 'getSessions'])->name('sessions.index');
        Route::post('/sessions', [AIAgentChatPageController::class, 'createSession'])->name('sessions.store');
        Route::delete('/sessions/{session}', [AIAgentChatPageController::class, 'destroySession'])->name('sessions.destroy');
        Route::get('/sessions/{session}/messages', [AIAgentChatPageController::class, 'getMessages'])->name('sessions.messages');
    });
"""

# add imports
content = re.sub(r'(use Illuminate\\Support\\Facades\\Route;)', r'\1' + imports, content)

# add routes
content = re.sub(r'(// Media Library API routes)', routes + r'\n    \1', content)

with open('routes/web.php', 'w') as f:
    f.write(content)
