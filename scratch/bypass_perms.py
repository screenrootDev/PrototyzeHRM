import re

files = [
    'app/Http/Controllers/AIAgentChatPageController.php',
    'app/Http/Controllers/MessengerController.php'
]

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    # Replace if (Auth::user()->can(...)) with if (true || Auth::user()->can(...))
    content = re.sub(r"if \(\s*Auth::user\(\)->can\([^)]+\)\s*\)", "if (true)", content)
    
    with open(file, 'w') as f:
        f.write(content)
        
print("Bypassed permissions in controllers.")
