import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove import
    content = re.sub(r'import\s+\{\s*useTranslation\s*\}\s+from\s+[\'"]react-i18next[\'"];?\n?', '', content)
    
    # Remove const { t } = useTranslation();
    content = re.sub(r'const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\);\n?', '', content)
    
    # Replace {t('string')} in attributes: e.g. placeholder={t('Enter')} -> placeholder="Enter"
    # To be safe, if we see something like placeholder={t('Enter')}, we replace with placeholder="Enter"
    # We can match `={t('something')}` and replace with `="something"`
    content = re.sub(r'=\{t\([\'"](.*?)[\'"]\)\}', r'="\1"', content)

    # Replace {t('string')} in children: e.g. <span>{t('Hello')}</span> -> <span>Hello</span>
    content = re.sub(r'\{t\([\'"](.*?)[\'"]\)\}', r'\1', content)
    
    # Replace t('string') in other places (like inside objects/arrays/functions) -> 'string'
    # Adding \b ensures we match `t(` and not `get(`.
    content = re.sub(r'\bt\([\'"](.*?)[\'"]\)', r"'\1'", content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed {filepath}")

def walk_dir(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    walk_dir('/Applications/XAMPP/xamppfiles/htdocs/PrototyzeHRM/resources/js/hooks')
