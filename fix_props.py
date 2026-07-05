import re

with open('resources/js/components/leave-timeline.tsx', 'r') as f:
    content = f.read()

content = content.replace("empGroup.employee_id", "empGroup.employee.id")
content = content.replace("empGroup.employee_avatar", "empGroup.employee?.avatar")
content = content.replace("empGroup.employee_name", "empGroup.employee?.name")

with open('resources/js/components/leave-timeline.tsx', 'w') as f:
    f.write(content)
