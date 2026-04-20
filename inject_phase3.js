const fs = require('fs');
const path = require('path');

const updateFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace INGREDIENT_CATALOG array definition with a dynamic read
  content = content.replace(
    /const INGREDIENT_CATALOG:\s*\{\s*name:\s*string;\s*imageUrl:\s*string\s*\|\s*null\s*\}\[\]\s*=\s*\[[\s\S]*?\];/g,
    `const ingredientsPath = require('path').join(__dirname, '../../../../ingredients_output.json');
    let INGREDIENT_CATALOG: { name: string; imageUrl: string | null }[] = [];
    if (require('fs').existsSync(ingredientsPath)) {
      const data = JSON.parse(require('fs').readFileSync(ingredientsPath, 'utf8'));
      INGREDIENT_CATALOG = data.map((x: any) => ({ name: x.ingredientName, imageUrl: x.imageUrl || null }));
    } else {
      console.warn("ingredients_output.json not found! Skipping extended ingredients.");
    }`
  );

  // In the loop for creating ingredients, update ingredientAllergen logic
  content = content.replace(
    /await prisma\.ingredientAllergen\.create\(\{[\s\S]*?\}\);/g,
    `if (ALLERGEN_ID[ing.name]) {
            await prisma.ingredientAllergen.create({
              data: { ingredientId: existing.id, allergenId: ALLERGEN_ID[ing.name] },
            });
          }`
  );

  // Now, link ingredients to foods
  content = content.replace(
    /for\s*\(\s*const\s+allergenName\s+of\s+f\.allergens\s*\)\s*\{/g,
    `const allIngs = [...new Set([...(f.allergens || []), ...((f as any).ingredients || [])])];
      for (const allergenName of allIngs) {`
  );

  fs.writeFileSync(filePath, content);
  console.log(`Updated Phase 3 in ${filePath}`);
};

updateFile(path.join(__dirname, 'src/seed/controlled.seed.ts'));
updateFile(path.join(__dirname, 'src/seed/controlled.seed.reset.ts'));
