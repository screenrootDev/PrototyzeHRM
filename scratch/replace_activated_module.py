import os

filepath = 'app/Services/AIAgentService.php'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace("'modules'     => ActivatedModule(),", "'modules'     => [],")

with open(filepath, 'w') as f:
    f.write(content)

print("Replaced ActivatedModule() with []")
