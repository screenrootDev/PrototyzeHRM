const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove import
    content = content.replace(/import\s+\{\s*useTranslation\s*\}\s+from\s+['"]react-i18next['"];?\n?/g, '');
    
    // Remove const { t } = useTranslation();
    content = content.replace(/const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\);\n?/g, '');
    
    // Replace {t('string')} with {'string'}
    // It's tricky to handle all cases with regex, but we can handle the most common ones.
    // {t('Dashboard')} -> {'Dashboard'}
    content = content.replace(/\{t\(['"](.*?)['"]\)\}/g, '$1');
    
    // Replace t('string') with 'string'
    content = content.replace(/t\(['"](.*?)['"]\)/g, "'$1'");

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Processed', filePath);
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

walkDir(path.join(__dirname, '../resources/js/pages/Helpdesk'));
