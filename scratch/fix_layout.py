import os
import glob

# Find all TSX files in ai-agent and messenger
files = glob.glob('resources/js/pages/ai-agent/**/*.tsx', recursive=True) + glob.glob('resources/js/pages/messenger/**/*.tsx', recursive=True)

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix authenticated-layout import to AppLayout
    content = content.replace("import AuthenticatedLayout from '@/layouts/authenticated-layout';", "import AppLayout from '@/layouts/AppLayout';")
    content = content.replace("import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';", "import AppLayout from '@/layouts/AppLayout';")
    
    # Replace AuthenticatedLayout tags
    content = content.replace("<AuthenticatedLayout", "<AppLayout")
    content = content.replace("</AuthenticatedLayout>", "</AppLayout>")
    
    with open(filepath, 'w') as f:
        f.write(content)

print("Fixed layout imports")
