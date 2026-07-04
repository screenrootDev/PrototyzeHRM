import re

with open('routes/web.php', 'r') as f:
    content = f.read()

imports = """
use App\\Http\\Controllers\\MessengerController;
"""

routes = """
    // Messenger routes
    Route::get('messenger', [MessengerController::class, 'index'])->name('messenger.index');
    Route::post('messenger/send', [MessengerController::class, 'send'])->name('messenger.send');
    Route::get('messenger/contacts', [MessengerController::class, 'getContacts'])->name('messenger.contacts');
    Route::get('messenger/messages/{userId}', [MessengerController::class, 'getMessages'])->name('messenger.messages');
    Route::post('messenger/toggle-favorite', [MessengerController::class, 'toggleFavorite'])->name('messenger.toggle-favorite');
    Route::get('messenger/favorites', [MessengerController::class, 'getFavorites'])->name('messenger.favorites');
    Route::put('messenger/messages/{messageId}/edit', [MessengerController::class, 'editMessage'])->name('messenger.edit-message');
    Route::delete('messenger/messages/{messageId}', [MessengerController::class, 'deleteMessage'])->name('messenger.delete-message');
    Route::post('/messenger/set-offline', [MessengerController::class, 'setOffline'])->name('messenger.set-offline');
    Route::post('/messenger/update-presence', [MessengerController::class, 'updatePresence'])->name('messenger.update-presence');
    Route::get('/messenger/online-users', [MessengerController::class, 'getOnlineUsers'])->name('messenger.online-users');
    Route::post('/messenger/toggle-pin', [MessengerController::class, 'togglePin'])->name('messenger.toggle-pin');
    Route::get('/messenger/pinned', [MessengerController::class, 'getPinned'])->name('messenger.pinned');
    Route::get('/messenger/check-new-messages', [MessengerController::class, 'checkNewMessages'])->name('messenger.check-new-messages');
"""

# add imports
content = re.sub(r'(use App\\Http\\Controllers\\AIAgentChatPageController;)', r'\1' + imports, content)

# add routes
content = re.sub(r'(// Landing Page content management \(Super Admin only\))', routes + r'\n        \1', content)

with open('routes/web.php', 'w') as f:
    f.write(content)
