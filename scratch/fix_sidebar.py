import sys

filepath = 'resources/js/components/app-sidebar.tsx'
with open(filepath, 'r') as f:
    content = f.read()

target = 'href: route("ai-agent.messenger.index")'
replacement = 'href: route("messenger.index")'

if target in content:
    content = content.replace(target, replacement)
    with open(filepath, 'w') as f:
        f.write(content)
    print("Fixed sidebar route")
else:
    print("Could not find target block")

