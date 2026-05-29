import re

def html_to_jsx(html):
    # Basic replacements
    jsx = html.replace('class=', 'className=')
    jsx = jsx.replace('for=', 'htmlFor=')
    jsx = jsx.replace('{{>', '{/*')
    jsx = jsx.replace('}}', '*/}')
    
    # Self-close tags
    jsx = re.sub(r'<img([^>]*[^/])>', r'<img\1/>', jsx)
    jsx = re.sub(r'<input([^>]*[^/])>', r'<input\1/>', jsx)
    jsx = re.sub(r'<hr([^>]*[^/])>', r'<hr\1/>', jsx)
    jsx = re.sub(r'<br([^>]*[^/])>', r'<br\1/>', jsx)
    
    # Comments
    jsx = re.sub(r'<!--(.*?)-->', r'{/*\1*/}', jsx, flags=re.DOTALL)
    
    return jsx

with open('/Users/chetandhargalkar/Downloads/Templates/tailwick-220/tailwick-220/HTML/src/dashboards-hr.html', 'r') as f:
    content = f.read()

# Extract from '<div class="grid lg:grid-cols-3 grid-cols-1 mb-5 gap-5">' to the end of the <main> block
start_idx = content.find('<div class="grid lg:grid-cols-3 grid-cols-1 mb-5 gap-5">')
end_idx = content.find('</main>')
if start_idx != -1 and end_idx != -1:
    main_html = content[start_idx:end_idx]
    
    jsx_content = html_to_jsx(main_html)
    
    with open('output.jsx', 'w') as f:
        f.write(jsx_content)
    print("Success")
else:
    print("Tags not found")
