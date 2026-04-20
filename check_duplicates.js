const fs = require('fs');
const path = require('path');

const checkFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.matchAll(/\{\s*foodName:\s*'([^']+)'[\s\S]*?(?=\s*\},\s*(?:\n|\/\/))/g);
  for (const match of matches) {
    const c = (match[0].match(/imageUrl:/g) || []).length;
    if (c > 1) {
      console.log(match[1], "has", c, "imageUrl");
    }
  }
};

checkFile(path.join(__dirname, 'src/seed/controlled.seed.ts'));
