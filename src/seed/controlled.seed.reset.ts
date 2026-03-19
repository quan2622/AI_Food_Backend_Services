import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function runReset() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService);

  console.log('🗑️  Resetting controlled seed data (@seed.test users)...');

  try {
    // Find all seed users
    const seedUsers = await prisma.user.findMany({
      where: { email: { endsWith: '@seed.test' } },
      select: { id: true },
    });
    const seedUserIds = seedUsers.map(u => u.id);

    if (seedUserIds.length === 0) {
      console.log('ℹ️  No seed users found. Nothing to reset.');
      return;
    }

    console.log(`Found ${seedUserIds.length} seed users. Deleting cascade...`);

    // 1. Delete MealItems via meals → daily_logs → users
    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId: { in: seedUserIds } },
      select: { id: true },
    });
    const dailyLogIds = dailyLogs.map(d => d.id);

    const meals = await prisma.meal.findMany({
      where: { dailyLogId: { in: dailyLogIds } },
      select: { id: true },
    });
    const mealIds = meals.map(m => m.id);

    await prisma.mealItem.deleteMany({ where: { mealId: { in: mealIds } } });
    console.log('  ✓ MealItems deleted');

    await prisma.meal.deleteMany({ where: { id: { in: mealIds } } });
    console.log('  ✓ Meals deleted');

    await prisma.dailyLog.deleteMany({ where: { id: { in: dailyLogIds } } });
    console.log('  ✓ DailyLogs deleted');

    await prisma.userAllergy.deleteMany({ where: { userId: { in: seedUserIds } } });
    console.log('  ✓ UserAllergies deleted');

    await prisma.nutritionGoal.deleteMany({ where: { userId: { in: seedUserIds } } });
    console.log('  ✓ NutritionGoals deleted');

    await prisma.userProfile.deleteMany({ where: { userId: { in: seedUserIds } } });
    console.log('  ✓ UserProfiles deleted');

    await prisma.user.deleteMany({ where: { id: { in: seedUserIds } } });
    console.log('  ✓ Users deleted');

    // 2. Delete food-related data (FoodIngredient → IngredientAllergen → Ingredient)
    const seedIngredientNames = [
      'Egg ingredient (seed)', 'Shellfish ingredient (seed)', 'Fish ingredient (seed)',
      'Gluten ingredient (seed)', 'Dairy ingredient (seed)', 'Peanut ingredient (seed)',
    ];
    const seedIngredients = await prisma.ingredient.findMany({
      where: { ingredientName: { in: seedIngredientNames } },
      select: { id: true },
    });
    const seedIngredientIds = seedIngredients.map(i => i.id);

    await prisma.foodIngredient.deleteMany({ where: { ingredientId: { in: seedIngredientIds } } });
    await prisma.ingredientAllergen.deleteMany({ where: { ingredientId: { in: seedIngredientIds } } });
    await prisma.ingredient.deleteMany({ where: { id: { in: seedIngredientIds } } });
    console.log('  ✓ Seed ingredients deleted');

    // 3. Delete foods from FOODS_FIXED (by name list)
    const seedFoodNames = [
      'Phở bò tái','Bún bò Huế','Cơm tấm sườn bì chả','Gà nướng lá chanh','Bò lúc lắc',
      'Cháo gà','Trứng hấp thịt bằm','Tôm nướng muối ớt','Gỏi cuốn tôm thịt','Nộm đu đủ bò khô',
      'Canh chua cá','Rau muống xào tỏi','Dưa hấu & trái cây','Súp bí đỏ','Gỏi gà bắp cải',
      'Canh khổ qua dồn thịt','Phở gà','Mì Quảng','Hủ tiếu Nam Vang','Cơm chiên dương châu',
      'Bánh cuốn nhân thịt','Xôi gà','Bánh mì thịt nguội','Cháo đậu xanh','Nem rán (chả giò)',
      'Bún riêu cua','Cơm gà Hội An','Bún mắm','Mì xào hải sản','Xôi xéo',
      'Bánh bao nhân thịt','Bánh mì chả cá','Cháo lòng','Bún thịt nướng','Chè đậu đỏ',
      'Chè trôi nước','Sinh tố bơ','Nước mía','Bánh bèo','Trà sữa trân châu',
      'Bánh tráng trộn','Gỏi cuốn chay','Bún đậu mắm tôm','Cơm tấm chả trứng','Phở cuốn',
      'Bánh mì chảo','Chả cá Lã Vọng','[Dummy - No Nutrition]','[Dummy - All Allergens]',
      'Bánh tráng nướng','Bánh ướt','Bánh khọt',
    ];

    const seedFoods = await prisma.food.findMany({
      where: { foodName: { in: seedFoodNames } },
      select: { id: true },
    });
    const seedFoodIds = seedFoods.map(f => f.id);

    // FoodNutritionValue → FoodNutritionProfile → Food
    const profiles = await prisma.foodNutritionProfile.findMany({
      where: { foodId: { in: seedFoodIds } },
      select: { id: true },
    });
    const profileIds = profiles.map(p => p.id);

    await prisma.foodNutritionValue.deleteMany({ where: { foodNutritionProfileId: { in: profileIds } } });
    await prisma.foodNutritionProfile.deleteMany({ where: { id: { in: profileIds } } });
    await prisma.food.deleteMany({ where: { id: { in: seedFoodIds } } });
    console.log('  ✓ Seed foods deleted');

    console.log('\n✅ Reset complete. Ready to run: npm run seed:controlled');
  } catch (err) {
    console.error('❌ Reset failed:', err);
    throw err;
  } finally {
    await app.close();
  }
}

void runReset();
