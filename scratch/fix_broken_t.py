import os
import re

def fix_broken_t_calls(directory):
    # Pattern to match 'template', {object}
    # This pattern looks for a string followed by a comma and an object literal.
    # It attempts to capture cases even if they aren't the start of a JSX expression.
    pattern = re.compile(r"(['\"])(.*?)\1\s*,\s*\{(.*?)\}")

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js', '.jsx')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                except Exception as e:
                    print(f"Error reading {path}: {e}")
                    continue
                
                def replace_match(match):
                    quote = match.group(1)
                    template = match.group(2)
                    vars_str = match.group(3)
                    
                    # Safety check: only replace if the template contains {{ }}
                    if "{{" not in template:
                        return match.group(0)
                    
                    # Parse vars_str to a dict of key: value
                    vars_map = {}
                    # Find all key: value pairs
                    var_matches = re.findall(r"(\w+)\s*:\s*([^,}]+)", vars_str)
                    if not var_matches:
                        return match.group(0)

                    for k, v in var_matches:
                        vars_map[k] = v.strip()
                    
                    # Replace {{key}} with ${value} in template
                    new_template = template
                    for k, v in vars_map.items():
                        new_template = new_template.replace(f"{{{{{k}}}}}", f"${{{v}}}")
                    
                    return f"`{new_template}`"

                new_content = pattern.sub(replace_match, content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed broken t-call in: {path}")

if __name__ == "__main__":
    target_dir = "/Applications/XAMPP/xamppfiles/htdocs/PrototyzeHRM/resources/js"
    fix_broken_t_calls(target_dir)
