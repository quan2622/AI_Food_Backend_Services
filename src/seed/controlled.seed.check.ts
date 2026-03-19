import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function checkSeed() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const prisma = app.get(PrismaService);

  console.log('\n=== Controlled Seed Spot Check ===\n');

  // 1. User counts
  const seedUsers = await prisma.user.count({ where: { email: { endsWith: '@seed.test' } } });
  console.log(`Seed users total: ${seedUsers}  (expected ≥ 72 — 10 SC + 50 cluster + 10 affinity + 10 pop + 2 reset pools)`);

  // 2. Food count
  const foods = await prisma.food.count();
  console.log(`Total foods: ${foods}  (expected 52+)`);

  // 3. Total MealItems
  const mealItems = await prisma.mealItem.count();
  console.log(`Total MealItems: ${mealItems}  (expected 10,000+)`);

  // 4. SC02 allergies
  const sc02 = await prisma.user.findUnique({
    where: { email: 'sc02@seed.test' },
    include: { allergies: { include: { allergen: true } } },
  });
  console.log(`SC02 allergies: [${sc02?.allergies.map(a => a.allergen.name).join(', ')}]  (expected: Shellfish, Fish)`);

  // 5. SC10 goal type
  const sc10 = await prisma.user.findUnique({
    where: { email: 'sc10@seed.test' },
    include: { nutritionGoals: { select: { goalType: true, targetCalories: true } } },
  });
  console.log(`SC10 goalType: ${sc10?.nutritionGoals[0]?.goalType}  (expected: STRICT_DIET), calories=${sc10?.nutritionGoals[0]?.targetCalories?.toFixed(0)}`);

  // 6. SC01 remaining today
  const sc01 = await prisma.user.findUnique({ where: { email: 'sc01@seed.test' } });
  if (sc01) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const log = await prisma.dailyLog.findUnique({
      where: { userId_logDate: { userId: sc01.id, logDate: today } },
      include: { meals: { include: { mealItems: true } } },
    });
    const consumed = log?.meals.flatMap(m => m.mealItems).reduce((s, i) => s + i.calories, 0) ?? 0;
    const goal = await prisma.nutritionGoal.findFirst({ where: { userId: sc01.id } });
    const remaining = goal ? goal.targetCalories - consumed : 0;
    console.log(`SC01 today: consumed=${consumed.toFixed(0)} kcal, target=${goal?.targetCalories.toFixed(0)}, remaining=${remaining.toFixed(0)}  (expected remaining ~500)`);
  }

  // 7. Top 5 popular foods
  console.log('\nTop 5 foods by meal count:');
  const top5 = await prisma.mealItem.groupBy({
    by: ['foodId'],
    _count: { foodId: true },
    orderBy: { _count: { foodId: 'desc' } },
    take: 5,
  });
  for (const t of top5) {
    const f = await prisma.food.findUnique({ where: { id: t.foodId }, select: { foodName: true } });
    console.log(`  ${f?.foodName} — count: ${t._count.foodId}`);
  }

  // 8. New foods (Group F) have createdAt within last 3 days
  const newFoods = await prisma.food.findMany({
    where: {
      foodName: { in: ['Bún đậu mắm tôm', 'Cơm tấm chả trứng', 'Phở cuốn', 'Bánh mì chảo', 'Chả cá Lã Vọng'] },
    },
    select: { foodName: true, createdAt: true },
  });
  console.log('\nNew items (Group F) createdAt:');
  newFoods.forEach(f => {
    const daysOld = (Date.now() - f.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    console.log(`  ${f.foodName} — ${daysOld.toFixed(1)} days ago  (expected ≤ 3)`);
  });

  // 9. Allergen links: dishes that should be blocked for SC02
  console.log('\nFoods with Shellfish or Fish allergen:');
  const shellfishFish = await prisma.ingredient.findMany({
    where: { ingredientName: { in: ['Shellfish ingredient (seed)', 'Fish ingredient (seed)'] } },
    include: { foodIngredients: { include: { food: { select: { foodName: true } } } }, ingredientAllergens: { include: { allergen: { select: { name: true } } } } },
  });
  for (const ing of shellfishFish) {
    const allergenName = ing.ingredientAllergens[0]?.allergen.name;
    ing.foodIngredients.forEach(fi => console.log(`  [${allergenName}] ${fi.food.foodName}`));
  }

  console.log('\n=== Spot check complete ===\n');
  await app.close();
}

void checkSeed();
