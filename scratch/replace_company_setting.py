import os

files = [
    'app/Http/Controllers/AIAgentChatPageController.php',
    'app/Services/AIAgentService.php'
]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    content = content.replace("company_setting(", "getSetting(")
    
    with open(filepath, 'w') as f:
        f.write(content)

print("Replaced company_setting with getSetting")
