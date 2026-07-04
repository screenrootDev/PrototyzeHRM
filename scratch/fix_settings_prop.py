filepath = 'resources/js/pages/settings/index.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace('<AIAgentSettings settings={systemSettings} />', '<AIAgentSettings userSettings={systemSettings} auth={auth} />')

with open(filepath, 'w') as f:
    f.write(content)

print("Updated settings prop")
