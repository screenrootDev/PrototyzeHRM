const fs = require('fs');

const dashboardFile = './resources/js/pages/dashboard.tsx';
let dashboardContent = fs.readFileSync(dashboardFile, 'utf8');

const replacementContent = fs.readFileSync('./replacement.txt', 'utf8');

const startTag = 'return (';
const startIndex = dashboardContent.indexOf(startTag);

if (startIndex !== -1) {
  // Find the end of the file or the end of the return block
  // We'll just replace everything from `return (` to the end since we are replacing the entire JSX return statement, and it's the last thing in the file.
  dashboardContent = dashboardContent.substring(0, startIndex) + replacementContent + '\n';
  fs.writeFileSync(dashboardFile, dashboardContent);
  console.log('Successfully updated dashboard.tsx with the Tailwick-exact UI structure.');
} else {
  console.error('Could not find return statement in dashboard.tsx');
}
