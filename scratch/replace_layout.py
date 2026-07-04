import re
import sys

filepath = sys.argv[1]

with open(filepath, 'r') as f:
    content = f.read()

# Replace import AuthenticatedLayout
content = re.sub(r"import\s+AuthenticatedLayout\s+from\s+'@/layouts/authenticated-layout';\n", "import AppLayout from '@/layouts/app-layout';\n", content)

# Replace <AuthenticatedLayout -> <AppLayout
content = re.sub(r"<AuthenticatedLayout", "<AppLayout", content)
content = re.sub(r"</AuthenticatedLayout>", "</AppLayout>", content)

with open(filepath, 'w') as f:
    f.write(content)

