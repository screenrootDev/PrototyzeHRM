filepath = 'resources/js/pages/settings/components/ai-agent-settings.tsx'
with open(filepath, 'r') as f:
    content = f.read()

target = "const canEdit = auth?.user?.permissions?.includes('manage-ai-agent');"
replacement = "const canEdit = auth?.permissions?.includes('manage-ai-agent') || auth?.user?.type === 'company' || auth?.user?.type === 'superadmin';"

if target in content:
    content = content.replace(target, replacement)
else:
    print("Could not find target string")

with open(filepath, 'w') as f:
    f.write(content)

print("Fixed canEdit")
