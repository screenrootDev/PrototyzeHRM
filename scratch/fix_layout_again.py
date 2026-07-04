import os
import glob

# Find all TSX files in ai-agent and messenger
files = glob.glob('resources/js/pages/ai-agent/**/*.tsx', recursive=True) + glob.glob('resources/js/pages/messenger/**/*.tsx', recursive=True)

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix authenticated-layout import to app-layout
    content = content.replace("import AppLayout from '@/layouts/AppLayout';", "import AppLayout from '@/layouts/app-layout';")
    
    with open(filepath, 'w') as f:
        f.write(content)

print("Fixed layout imports again")
