import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { GoalType, MealType, ActivityLevel, SourceType, UnitType, SeverityType, StatusType } from '../generated/prisma/client';

// --- CONFIGURATION ---
const NUM_USERS = 60;
const NUM_FOODS = 120;

const NUTRIENTS = [
  { name: 'Calories', unit: UnitType.UNIT_KG },
  { name: 'Protein', unit: UnitType.UNIT_G },
  { name: 'Carbohydrates', unit: UnitType.UNIT_G },
  { name: 'Fat', unit: UnitType.UNIT_G },
  { name: 'Fiber', unit: UnitType.UNIT_G },
];

const ALLERGENS = [
  'Peanut', 'Gluten', 'Dairy', 'Egg', 'Shellfish',
  'Soy', 'Tree Nut', 'Fish', 'Sesame', 'Wheat', 'Lupin', 'Mustard'
];

const CATEGORIES = [
  'Cơm', 'Bún', 'Phở', 'Mì', 'Bánh mì',
  'Salad', 'Sandwich', 'Soup', 'Grill', 'Stir-fry',
  'Snack', 'Dessert', 'Drink', 'Breakfast bowl', 'Rice bowl'
];

const CLUSTER_PREFS = {
  'A': ['Salad', 'Grill', 'Breakfast bowl'],
  'B': ['Cơm', 'Bún', 'Phở'],
  'C': ['Grill', 'Rice bowl', 'Sandwich'],
  'D': ['Snack', 'Dessert', 'Drink'],
  'E': ['Soup', 'Salad', 'Mì'],
};

const GOAL_CONFIG = {
  [GoalType.WEIGHT_LOSS]: { calories: 1600, protein: 120, carbs: 160, fat: 50, fiber: 25 },
  [GoalType.WEIGHT_GAIN]: { calories: 2800, protein: 160, carbs: 350, fat: 90, fiber: 20 },
  [GoalType.MAINTENANCE]: { calories: 2000, protein: 100, carbs: 250, fat: 65, fiber: 25 },
};

// Helper to get random number for nutrition
function getRandomNutrition(categoryName: string) {
  const templates = {
    'Salad': { c: 180, p: 15, cr: 30, f: 10, fi: 8 },
    'Phở': { c: 380, p: 25, cr: 55, f: 12, fi: 2 },
    'Cơm': { c: 450, p: 20, cr: 65, f: 15, fi: 3 },
    'Snack': { c: 280, p: 5, cr: 40, f: 20, fi: 1 },
    'Grill': { c: 520, p: 40, cr: 10, f: 30, fi: 1 },
    'Default': { c: 300, p: 20, cr: 40, f: 15, fi: 2 },
  };
  const t = templates[categoryName] || templates['Default'];
  const noise = () => (Math.random() * 0.4 + 0.8); // 80% - 120%
  return {
    Calories: t.c * noise(),
    Protein: t.p * noise(),
    Carbohydrates: t.cr * noise(),
    Fat: t.f * noise(),
    Fiber: t.fi * noise(),
  };
}

async function runSeed() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const prisma = app.get(PrismaService);

  console.log('🚀 Starting Seed Recommender Data...');

  try {
    // 1. Nutrients
    console.log('--- Seeding Nutrients ---');
    for (const n of NUTRIENTS) {
      await prisma.nutrient.upsert({
        where: { name: n.name },
        update: {},
        create: n,
      });
    }
    const dbNutrients = await prisma.nutrient.findMany();
    const nutrientMap = Object.fromEntries(dbNutrients.map(n => [n.name, n.id]));

    // 2. Allergens
    console.log('--- Seeding Allergens ---');
    for (const name of ALLERGENS) {
      await prisma.allergen.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
    const dbAllergens = await prisma.allergen.findMany();

    // 3. Categories
    console.log('--- Seeding Categories ---');
    for (const name of CATEGORIES) {
      await prisma.foodCategory.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
    const dbCategories = await prisma.foodCategory.findMany();

    // 4. Foods & Profiles (Bulk creation might be tricky with nested, so use loop)
    console.log('--- Seeding Foods (120 records) ---');
    const foods: any[] = [];
    for (let i = 0; i < NUM_FOODS; i++) {
        const cat = dbCategories[i % dbCategories.length];
        const isNew = i < 24; 
        const createdAt = new Date();
        if (!isNew) {
            createdAt.setDate(createdAt.getDate() - (8 + Math.floor(Math.random() * 300)));
        }

        const food = await prisma.food.create({
            data: {
                foodName: `${cat.name} #${String(i + 1).padStart(3, '0')}`,
                categoryId: cat.id,
                createdAt,
                nutritionProfile: {
                    create: {
                        source: SourceType.MANUAL,
                        values: {
                            create: Object.entries(getRandomNutrition(cat.name)).map(([name, val]) => ({
                                nutrientId: nutrientMap[name],
                                value: parseFloat(val.toFixed(2)),
                            }))
                        }
                    }
                }
            },
            include: { nutritionProfile: { include: { values: true } } }
        });
        foods.push(food);
    }

    // 5. Users, Profiles & Goals
    console.log('--- Seeding Users (60 records) ---');
    const users: any[] = [];
    const clusterKeys = Object.keys(CLUSTER_PREFS);
    
    for (let i = 0; i < NUM_USERS; i++) {
        const tier = i < 10 ? 'cold' : i < 35 ? 'moderate' : 'heavy';
        const cluster = i < 50 ? clusterKeys[i % clusterKeys.length] : null;
        const goalType = cluster === 'A' ? GoalType.WEIGHT_LOSS : cluster === 'C' ? GoalType.WEIGHT_GAIN : GoalType.MAINTENANCE;

        const email = `user${String(i).padStart(3, '0')}@seed.test`;
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password: 'hashed_password_placeholder', 
                fullName: `Seed User ${String(i).padStart(3, '0')}`,
                isAdmin: false,
                userProfile: {
                    create: {
                        age: 20 + Math.floor(Math.random() * 30),
                        height: 160 + Math.random() * 20,
                        weight: 50 + Math.random() * 40,
                        bmi: 22,
                        bmr: 1500,
                        tdee: 2000,
                        gender: i % 2 === 0 ? 'male' : 'female',
                        activityLevel: ActivityLevel.MODERATELY_ACTIVE,
                    }
                },
                nutritionGoals: {
                    create: {
                        goalType,
                        targetCalories: GOAL_CONFIG[goalType].calories + (Math.random() * 200 - 100),
                        targetProtein: GOAL_CONFIG[goalType].protein,
                        targetCarbs: GOAL_CONFIG[goalType].carbs,
                        targetFat: GOAL_CONFIG[goalType].fat,
                        targetFiber: GOAL_CONFIG[goalType].fiber,
                        startDay: new Date(),
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    }
                }
            }
        });
        users.push({ ...user, tier, cluster });

        if (Math.random() < 0.3) {
            await prisma.userAllergy.create({
                data: {
                    userId: user.id,
                    allergenId: dbAllergens[Math.floor(Math.random() * dbAllergens.length)].id,
                    severity: SeverityType.MEDIUM
                }
            }).catch(() => {});
        }
    }

    // 6. History (Building ~12,000 Meal Items)
    console.log('--- Seeding History (~12,000 Meal Items) ---');
    for (const user of users) {
        let logCount = 0;
        if (user.tier === 'cold') logCount = Math.floor(Math.random() * 5);
        else if (user.tier === 'moderate') logCount = 10 + Math.floor(Math.random() * 30);
        else logCount = 60 + Math.floor(Math.random() * 100);

        const favCats = CLUSTER_PREFS[user.cluster] || [];
        const preferredFoods = foods.filter(f => {
            const cat = dbCategories.find(c => c.id === f.categoryId);
            return favCats.includes(cat?.name);
        });
        const otherFoods = foods.filter(f => {
            const cat = dbCategories.find(c => c.id === f.categoryId);
            return !favCats.includes(cat?.name);
        });

        for (let d = 0; d < logCount; d++) {
            const logDate = new Date();
            logDate.setDate(logDate.getDate() - d);
            logDate.setHours(0, 0, 0, 0);

            const dailyLog = await prisma.dailyLog.upsert({
                where: { userId_logDate: { userId: user.id, logDate } },
                update: {},
                create: {
                    userId: user.id,
                    logDate,
                    status: StatusType.BELOW
                }
            });

            const mealTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];
            for (const mealType of mealTypes) {
                const meal = await prisma.meal.create({
                    data: {
                        dailyLogId: dailyLog.id,
                        mealType,
                        mealDateTime: new Date(logDate)
                    }
                });

                const itemCount = 2 + Math.floor(Math.random() * 2);
                const mealItemsData: any[] = [];

                for (let i = 0; i < itemCount; i++) {
                    const pool = (Math.random() < 0.7 && preferredFoods.length > 0) ? preferredFoods : otherFoods;
                    const food = pool[Math.floor(Math.random() * pool.length)];
                    const qty = 0.5 + Math.random() * 1.5;

                    const getVal = (name: string) => {
                        const v = food.nutritionProfile?.values.find((v: any) => v.nutrientId === nutrientMap[name]);
                        return (v?.value || 0) * (qty);
                    };

                    mealItemsData.push({
                        mealId: meal.id,
                        foodId: food.id,
                        quantity: qty,
                        calories: parseFloat(getVal('Calories').toFixed(2)),
                        protein: parseFloat(getVal('Protein').toFixed(2)),
                        carbs: parseFloat(getVal('Carbohydrates').toFixed(2)),
                        fat: parseFloat(getVal('Fat').toFixed(2)),
                        fiber: parseFloat(getVal('Fiber').toFixed(2)),
                    });
                }
                await prisma.mealItem.createMany({ data: mealItemsData });
            }
        }
    }

    console.log('✅ All done! Recommender data seeded successfully.');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await app.close();
  }
}

void runSeed();
