import re
import sys

filepath = sys.argv[1]

with open(filepath, 'r') as f:
    content = f.read()

# Remove useTranslation import
content = re.sub(r"import\s*{\s*useTranslation\s*}\s*from\s*'react-i18next';\n", "", content)

# Remove const { t } = useTranslation();
content = re.sub(r"\s*const\s*{\s*t\s*}\s*=\s*useTranslation\(\);\n", "\n", content)

# Replace {t('some string')} with {'some string'}
# Specifically handle t('string') or t("string") -> 'string'
content = re.sub(r"t\('([^']+)'\)", r"'\1'", content)
content = re.sub(r't\("([^"]+)"\)', r"'\1'", content)

with open(filepath, 'w') as f:
    f.write(content)

