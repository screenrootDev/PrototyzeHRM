import sys

filepath = 'resources/js/components/app-sidebar.tsx'
with open(filepath, 'r') as f:
    content = f.read()

target = """    if (hasPermission(permissions, "manage-dashboard")) {
      items.push({
        title: "Dashboard",
        href: route("dashboard"),
        icon: () => <LayoutGridIcon size={16} isAnimated={true} />,
        group: "Overview",
      });
    }"""

addition = """

    // Always show AI Agent and Messenger for now
    items.push({
      title: "AI Agent",
      href: route("ai-agent.chat.page"),
      icon: () => <SparklesIcon size={16} isAnimated={true} />,
      group: "Overview",
      badge: "NEW"
    });

    items.push({
      title: "Messenger",
      href: route("ai-agent.messenger.index"),
      icon: () => <MessageCircleIcon size={16} isAnimated={true} />,
      group: "Overview",
    });
"""

if target in content:
    content = content.replace(target, target + addition)
    with open(filepath, 'w') as f:
        f.write(content)
    print("Added to sidebar")
else:
    print("Could not find target block")

