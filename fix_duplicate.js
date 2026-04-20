const fs = require('fs');
const path = require('path');

const fixFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Match each food object block from { foodName: to the end of the object before },
  content = content.replace(/\{\s*foodName:[\s\S]*?(?=\s*\},\s*(?:\n|\/\/))/g, (match) => {
    // Check if there are multiple 'imageUrl:'
    const imageUrlMatches = [...match.matchAll(/imageUrl:/g)];
    if (imageUrlMatches.length > 1) {
      // Remove the last 'imageUrl:' and its value
      return match.replace(/\s*imageUrl:\s*'[^']+',?(?=[^}]*$)/, '');
    }
    return match;
  });

  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${filePath}`);
};

fixFile(path.join(__dirname, 'src/seed/controlled.seed.ts'));
fixFile(path.join(__dirname, 'src/seed/controlled.seed.reset.ts'));
