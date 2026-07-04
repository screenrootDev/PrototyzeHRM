import sys

filepath = 'resources/js/pages/ai-agent/chat/index.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace MessageInput
old_input = """        <div className="border-t bg-background/80 backdrop-blur-sm">
            <div className="max-w-5xl mx-auto px-4 py-4">
                <div className="flex gap-3 items-end bg-background border rounded-2xl shadow-sm p-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={value}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Message AI Agent..."
                        disabled={loading}
                        className="flex-1 resize-none bg-transparent px-2 py-2 text-[15px] focus:outline-none disabled:opacity-50 max-h-[200px] overflow-y-auto"
                        style={{ minHeight: '36px' }}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={loading || !value.trim()}
                        className="h-9 w-9 shrink-0 rounded-xl"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>"""

new_input = """        <div className="bg-background pt-2 pb-6">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex gap-2 items-end bg-background border border-gray-200 rounded-3xl shadow-sm pl-4 pr-1.5 py-1.5 focus-within:border-primary/50 transition-colors">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={value}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Message AI Agent..."
                        disabled={loading}
                        className="flex-1 resize-none bg-transparent py-2.5 text-[15px] focus:outline-none disabled:opacity-50 max-h-[200px] overflow-y-auto"
                        style={{ minHeight: '44px' }}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={loading || !value.trim()}
                        className="h-9 w-9 shrink-0 rounded-full bg-emerald-400 hover:bg-emerald-500 text-white mb-0.5"
                    >
                        <Send className="h-4 w-4 ml-0.5" />
                    </Button>
                </div>
            </div>
        </div>"""
content = content.replace(old_input, new_input)


# Replace Sidebar
old_sidebar_top = """                <div className="w-64 border-r flex flex-col bg-muted/20 shrink-0">
                    <div className="p-3 border-b bg-background/50 space-y-3">
                        <Button 
                            onClick={createNewChat} 
                            variant="outline"
                            className="w-full gap-2 h-9 font-medium hover:bg-primary hover:text-primary-foreground transition-colors" 
                            size="sm"
                        >
                            <Plus className="h-4 w-4" />
                            {'New Chat'}
                        </Button>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={'Search chats...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-8 pr-8 text-xs rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            />"""
                            
new_sidebar_top = """                <div className="w-72 border-r flex flex-col bg-background shrink-0">
                    <div className="p-4 space-y-4">
                        <Button 
                            onClick={createNewChat} 
                            variant="outline"
                            className="w-full gap-2 h-10 font-medium hover:bg-muted/50 hover:text-foreground transition-colors justify-center rounded-lg border-gray-200 shadow-sm" 
                        >
                            <Plus className="h-4 w-4" />
                            {'New Chat'}
                        </Button>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={'Search chats...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-9 pl-9 pr-8 text-sm rounded-lg border border-gray-200 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            />"""
content = content.replace(old_sidebar_top, new_sidebar_top)


old_active_session = """                                            className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                                                activeSession?.id === session.id
                                                    ? 'bg-accent text-accent-foreground font-medium'
                                                    : 'hover:bg-muted/50 text-foreground'
                                            }`}"""
                                            
new_active_session = """                                            className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                                                activeSession?.id === session.id
                                                    ? 'bg-gray-100 text-foreground font-medium'
                                                    : 'hover:bg-gray-50 text-muted-foreground'
                                            }`}"""
content = content.replace(old_active_session, new_active_session)


old_main_area = """                <div className="flex-1 flex flex-col bg-gradient-to-b from-background to-muted/10">"""
new_main_area = """                <div className="flex-1 flex flex-col bg-background">"""
content = content.replace(old_main_area, new_main_area)


old_messages = """                        {activeSession && !loadingMessages && messages.length > 0 && (
                            <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                                {messages.map((msg, i) => (
                                    <div key={i} className="space-y-2">
                                        {msg.role === 'assistant' && (
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">"""

new_messages = """                        {activeSession && !loadingMessages && messages.length > 0 && (
                            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                                {messages.map((msg, i) => (
                                    <div key={i} className="space-y-2">
                                        {msg.role === 'assistant' && (
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-1.5 text-xs italic text-orange-500/80 mb-3">
                                                        <Sparkles className="h-3.5 w-3.5" />
                                                        <span>Demo Mode: This is a static response. In production, AI Agent analyzes your real database.</span>
                                                    </div>
                                                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">"""
content = content.replace(old_messages, new_messages)


old_user_msg = """                                        {msg.role === 'user' && (
                                            <div className="flex justify-end">
                                                <div className="max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap bg-accent text-accent-foreground shadow-sm">"""
                                                
new_user_msg = """                                        {msg.role === 'user' && (
                                            <div className="flex justify-end">
                                                <div className="rounded-2xl px-5 py-3 text-[15px] leading-relaxed whitespace-pre-wrap bg-gray-100 text-gray-900">"""
content = content.replace(old_user_msg, new_user_msg)


with open(filepath, 'w') as f:
    f.write(content)

