filepath = 'resources/js/pages/settings/components/ai-agent-settings.tsx'
with open(filepath, 'r') as f:
    content = f.read()

target = "export default function AIAgentSettings({ userSettings = {}, auth }: AIAgentSettingsProps) {"
replacement = "export default function AIAgentSettings({ userSettings, auth }: AIAgentSettingsProps) {"

content = content.replace(target, replacement)

target2 = "        setAiSettings({"
replacement2 = "        if (!userSettings) return;\n        setAiSettings({"

content = content.replace(target2, replacement2)

with open(filepath, 'w') as f:
    f.write(content)

print("Fixed loop")
