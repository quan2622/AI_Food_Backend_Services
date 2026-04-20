const fs = require('fs');
const path = require('path');

const foodsJsonPath = path.join(__dirname, 'foods_output.json');
const foodsData = JSON.parse(fs.readFileSync(foodsJsonPath, 'utf8'));

const getUrl = (name) => {
  const f = foodsData.find(x => x.foodName === name);
  return f ? f.imageUrl : '';
};

const updateFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/(foodName:\s*'([^']+)',)(?!\s*imageUrl:)/g, (match, p1, p2) => {
      const url = getUrl(p2);
      if (url) {
          return `${p1}\n    imageUrl: '${url}',`;
      }
      return p1;
  });
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
};

updateFile(path.join(__dirname, 'src/seed/controlled.seed.ts'));
updateFile(path.join(__dirname, 'src/seed/controlled.seed.reset.ts'));
