import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { GoalType, MealType, ActivityLevel, StatusType } from '../generated/prisma/client';

async function runTestScenarios() {
  const app = await NestFactory.create(AppModule);
  const prisma = app.get(PrismaService);

  console.log('🚀 Creating Specific Test Scenarios...');

  const foods = await prisma.food.findMany({ include: { nutritionProfile: { include: { values: true } } } });
  const nutrientMap = Object.fromEntries((await prisma.nutrient.findMany()).map(n => [n.name, n.id]));

  // Helper to add history for a user
  const addMeal = async (userId: number, date: Date, type: MealType, foodIndices: number[]) => {
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);
    const log = await prisma.dailyLog.upsert({
      where: { userId_logDate: { userId, logDate } },
      update: {},
      create: { userId, logDate, status: StatusType.BELOW }
    });
    const meal = await prisma.meal.create({
      data: { dailyLogId: log.id, mealType: type, mealDateTime: date }
    });
    for (const idx of foodIndices) {
      const food = foods[idx % foods.length];
      const qty = 1.0;
      const getVal = (name: string) => {
          const v = food.nutritionProfile?.values.find((v: any) => v.nutrientId === nutrientMap[name]);
          return (v?.value || 0) * qty;
      };
      await prisma.mealItem.create({
        data: {
          mealId: meal.id, foodId: food.id, quantity: qty,
          calories: getVal('Calories'), protein: getVal('Protein'),
          carbs: getVal('Carbohydrates'), fat: getVal('Fat'), fiber: getVal('Fiber')
        }
      });
    }
  };

  // 1. NEW USER (Cold Start)
  console.log('- Creating: new_user@test.io');
  await prisma.user.upsert({
    where: { email: 'new_user@test.io' },
    update: {},
    create: {
      email: 'new_user@test.io', password: 'password123', fullName: 'Cold Start User',
      userProfile: { create: { age: 25, height: 170, weight: 60, bmi: 20.7, bmr: 1500, tdee: 1800, activityLevel: ActivityLevel.SEDENTARY } },
      nutritionGoals: { create: { goalType: GoalType.MAINTENANCE, targetCalories: 1800, targetProtein: 100, targetCarbs: 200, targetFat: 60, targetFiber: 20, startDay: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
    }
  });

  // 2. MORNING USER (Starts new day)
  console.log('- Creating: morning@test.io');
  const morningUser = await prisma.user.upsert({
    where: { email: 'morning@test.io' },
    update: {},
    create: {
      email: 'morning@test.io', password: 'password123', fullName: 'Morning Test User',
      userProfile: { create: { age: 28, height: 175, weight: 70, bmi: 22.8, bmr: 1600, tdee: 2200, activityLevel: ActivityLevel.MODERATELY_ACTIVE } },
      nutritionGoals: { create: { goalType: GoalType.MAINTENANCE, targetCalories: 2200, targetProtein: 120, targetCarbs: 250, targetFat: 70, targetFiber: 25, startDay: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
    }
  });
  // Add 10 days of history (only breakfast)
  for (let i = 1; i <= 10; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    await addMeal(morningUser.id, d, MealType.BREAKFAST, [i, i+1]);
  }

  // 3. LUNCH USER (Eaten breakfast already)
  console.log('- Creating: lunch@test.io');
  const lunchUser = await prisma.user.upsert({
    where: { email: 'lunch@test.io' },
    update: {},
    create: {
      email: 'lunch@test.io', password: 'password123', fullName: 'Lunch Test User',
      userProfile: { create: { age: 30, height: 165, weight: 55, bmi: 20.2, bmr: 1300, tdee: 1600, activityLevel: ActivityLevel.LIGHTLY_ACTIVE } },
      nutritionGoals: { create: { goalType: GoalType.WEIGHT_LOSS, targetCalories: 1400, targetProtein: 100, targetCarbs: 150, targetFat: 40, targetFiber: 20, startDay: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
    }
  });
  // Today's breakfast
  const today = new Date();
  await addMeal(lunchUser.id, today, MealType.BREAKFAST, [5, 6]);

  // 4. DINNER USER (Eaten Breakfast + Lunch)
  console.log('- Creating: dinner@test.io');
  const dinnerUser = await prisma.user.upsert({
    where: { email: 'dinner@test.io' },
    update: {},
    create: {
      email: 'dinner@test.io', password: 'password123', fullName: 'Dinner Test User',
      userProfile: { create: { age: 35, height: 180, weight: 85, bmi: 26.2, bmr: 1900, tdee: 2500, activityLevel: ActivityLevel.MODERATELY_ACTIVE } },
      nutritionGoals: { create: { goalType: GoalType.WEIGHT_GAIN, targetCalories: 2800, targetProtein: 150, targetCarbs: 350, targetFat: 90, targetFiber: 25, startDay: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
    }
  });
  await addMeal(dinnerUser.id, today, MealType.BREAKFAST, [10, 11]);
  await addMeal(dinnerUser.id, today, MealType.LUNCH, [20, 21]);

  // 5. SNACK USER
  console.log('- Creating: snack@test.io');
  await prisma.user.upsert({
    where: { email: 'snack@test.io' },
    update: {},
    create: {
      email: 'snack@test.io', password: 'password123', fullName: 'Snack Test User',
      userProfile: { create: { age: 22, height: 160, weight: 48, bmi: 18.8, bmr: 1200, tdee: 1500, activityLevel: ActivityLevel.SEDENTARY } },
      nutritionGoals: { create: { goalType: GoalType.MAINTENANCE, targetCalories: 1500, targetProtein: 80, targetCarbs: 180, targetFat: 50, targetFiber: 20, startDay: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
    }
  });

  console.log('✅ Specific Test Scenarios Created!');
  await app.close();
}

void runTestScenarios();
