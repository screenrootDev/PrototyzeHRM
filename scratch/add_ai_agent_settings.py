import re

filepath = 'resources/js/pages/settings/index.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add import
import_target = "import BrandSettings from './components/brand-settings';"
import_addition = "import AIAgentSettings from './components/ai-agent-settings';\n"
if "AIAgentSettings" not in content:
    content = content.replace(import_target, import_addition + import_target)

# Add ref
ref_target = "const brandSettingsRef = useRef<HTMLDivElement>(null);"
ref_addition = "const aiAgentSettingsRef = useRef<HTMLDivElement>(null);\n  "
if "aiAgentSettingsRef =" not in content:
    content = content.replace(ref_target, ref_target + "\n  " + ref_addition)

# Add to allSidebarNavItems
nav_target = """    {
      title: 'Chat GPT Settings',"""
nav_addition = """    {
      title: 'AI Agent Settings',
      href: '#ai-agent-settings',
      icon: <Bot className="h-4 w-4 mr-2" />,
      permission: 'manage-ai-agent'
    },
"""
if "AI Agent Settings" not in content:
    content = content.replace(nav_target, nav_addition + nav_target)

# Add Section
section_target = """          {/* Chat GPT Settings Section */}"""
section_addition = """          {/* AI Agent Settings Section */}
          {(auth.permissions?.includes('manage-ai-agent') || auth.user?.type === 'company' || auth.user?.type === 'superadmin') && (
            <section id="ai-agent-settings" ref={aiAgentSettingsRef} className="mb-8">
              <AIAgentSettings settings={systemSettings} />
            </section>
          )}

"""
if "id=\"ai-agent-settings\"" not in content:
    content = content.replace(section_target, section_addition + section_target)

with open(filepath, 'w') as f:
    f.write(content)

print("Updated settings/index.tsx")
