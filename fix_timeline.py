import re

with open('resources/js/components/leave-timeline.tsx', 'r') as f:
    content = f.read()

# Add getImagePath to imports
if 'getImagePath' not in content:
    content = content.replace("import { router } from '@inertiajs/react';", "import { router } from '@inertiajs/react';\nimport { getImagePath } from '@/utils/helpers';")

# Fix the AvatarImage src
content = content.replace(
    "src={empGroup.employee_avatar ? (window as any).storage ? (window as any).storage(empGroup.employee_avatar) : empGroup.employee_avatar : undefined}",
    "src={empGroup.employee_avatar ? getImagePath(empGroup.employee_avatar) : undefined}"
)

# Wait, what if empGroup.employee_name is undefined?
# Let's add fallbacks.
content = content.replace(
    "empGroup.employee_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()",
    "(empGroup.employee_name || 'U').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()"
)

with open('resources/js/components/leave-timeline.tsx', 'w') as f:
    f.write(content)
