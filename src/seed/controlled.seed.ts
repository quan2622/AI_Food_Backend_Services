import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

// ─── MASTER DATA ──────────────────────────────────────────────────────────────

const NUTRIENTS = [
  { name: 'Calories', unit: 'UNIT_KG' as const },
  { name: 'Protein', unit: 'UNIT_G' as const },
  { name: 'Carbohydrates', unit: 'UNIT_G' as const },
  { name: 'Fat', unit: 'UNIT_G' as const },
  { name: 'Fiber', unit: 'UNIT_G' as const },
];

const ALLERGEN_NAMES = [
  'Peanut',
  'Gluten',
  'Dairy',
  'Egg',
  'Shellfish',
  'Soy',
  'Tree Nut',
  'Fish',
  'Sesame',
  'Wheat',
  'Lupin',
  'Mustard',
];

const CATEGORY_NAMES = [
  'Phở',
  'Bún',
  'Cơm',
  'Mì',
  'Bánh mì',
  'Gỏi & Salad',
  'Canh & Súp',
  'Món nướng',
  'Món xào',
  'Cháo',
  'Bánh & Xôi',
  'Chè & Tráng miệng',
  'Nước uống',
  'Nem & Cuốn',
  'Cơm bowl',
];

// ─── FOOD CATALOG (Groups A–G) cal/protein/carbs/fat/fiber per 100g ───────────

const FOODS_FIXED = [
  // Group A — HIGH PROTEIN
  {
    foodName: 'Phở bò tái',
    cat: 'Phở',
    cal: 185,
    pro: 18,
    carb: 20,
    fat: 4.5,
    fib: 0.8,
    allergens: [],
  },
  {
    foodName: 'Bún bò Huế',
    cat: 'Bún',
    cal: 195,
    pro: 17,
    carb: 22,
    fat: 5.0,
    fib: 1.0,
    allergens: [],
  },
  {
    foodName: 'Cơm tấm sườn bì chả',
    cat: 'Cơm',
    cal: 420,
    pro: 28,
    carb: 48,
    fat: 12,
    fib: 2.0,
    allergens: ['Egg'],
  },
  {
    foodName: 'Gà nướng lá chanh',
    cat: 'Món nướng',
    cal: 210,
    pro: 32,
    carb: 2,
    fat: 8.5,
    fib: 0.5,
    allergens: [],
  },
  {
    foodName: 'Bò lúc lắc',
    cat: 'Món xào',
    cal: 280,
    pro: 30,
    carb: 8,
    fat: 14,
    fib: 1.0,
    allergens: [],
  },
  {
    foodName: 'Cháo gà',
    cat: 'Cháo',
    cal: 120,
    pro: 14,
    carb: 18,
    fat: 2.5,
    fib: 0.5,
    allergens: [],
  },
  {
    foodName: 'Trứng hấp thịt bằm',
    cat: 'Món xào',
    cal: 165,
    pro: 15,
    carb: 5,
    fat: 10,
    fib: 0.3,
    allergens: ['Egg'],
  },
  {
    foodName: 'Tôm nướng muối ớt',
    cat: 'Món nướng',
    cal: 135,
    pro: 26,
    carb: 3,
    fat: 2.0,
    fib: 0.0,
    allergens: ['Shellfish'],
  },
  // Group B — HIGH FIBER
  {
    foodName: 'Gỏi cuốn tôm thịt',
    cat: 'Nem & Cuốn',
    cal: 95,
    pro: 8,
    carb: 14,
    fat: 2.0,
    fib: 2.5,
    allergens: ['Shellfish'],
  },
  {
    foodName: 'Nộm đu đủ bò khô',
    cat: 'Gỏi & Salad',
    cal: 110,
    pro: 12,
    carb: 15,
    fat: 2.5,
    fib: 3.0,
    allergens: [],
  },
  {
    foodName: 'Canh chua cá',
    cat: 'Canh & Súp',
    cal: 85,
    pro: 10,
    carb: 10,
    fat: 2.0,
    fib: 2.8,
    allergens: ['Fish'],
  },
  {
    foodName: 'Rau muống xào tỏi',
    cat: 'Món xào',
    cal: 55,
    pro: 3,
    carb: 8,
    fat: 2.0,
    fib: 3.5,
    allergens: [],
  },
  {
    foodName: 'Dưa hấu & trái cây',
    cat: 'Chè & Tráng miệng',
    cal: 45,
    pro: 1,
    carb: 11,
    fat: 0.2,
    fib: 1.2,
    allergens: [],
  },
  {
    foodName: 'Súp bí đỏ',
    cat: 'Canh & Súp',
    cal: 70,
    pro: 2,
    carb: 14,
    fat: 1.5,
    fib: 2.0,
    allergens: [],
  },
  {
    foodName: 'Gỏi gà bắp cải',
    cat: 'Gỏi & Salad',
    cal: 120,
    pro: 15,
    carb: 10,
    fat: 3.5,
    fib: 2.5,
    allergens: [],
  },
  {
    foodName: 'Canh khổ qua dồn thịt',
    cat: 'Canh & Súp',
    cal: 90,
    pro: 9,
    carb: 8,
    fat: 3.0,
    fib: 3.2,
    allergens: [],
  },
  // Group C — MODERATE
  {
    foodName: 'Phở gà',
    cat: 'Phở',
    cal: 165,
    pro: 14,
    carb: 20,
    fat: 3.5,
    fib: 0.8,
    allergens: [],
  },
  {
    foodName: 'Mì Quảng',
    cat: 'Mì',
    cal: 310,
    pro: 16,
    carb: 42,
    fat: 8.0,
    fib: 2.0,
    allergens: ['Gluten', 'Shellfish'],
  },
  {
    foodName: 'Hủ tiếu Nam Vang',
    cat: 'Mì',
    cal: 290,
    pro: 18,
    carb: 38,
    fat: 7.5,
    fib: 1.5,
    allergens: [],
  },
  {
    foodName: 'Cơm chiên dương châu',
    cat: 'Cơm',
    cal: 380,
    pro: 12,
    carb: 55,
    fat: 12,
    fib: 1.5,
    allergens: ['Egg'],
  },
  {
    foodName: 'Bánh cuốn nhân thịt',
    cat: 'Bánh & Xôi',
    cal: 180,
    pro: 10,
    carb: 28,
    fat: 4.0,
    fib: 1.0,
    allergens: ['Gluten'],
  },
  {
    foodName: 'Xôi gà',
    cat: 'Bánh & Xôi',
    cal: 290,
    pro: 18,
    carb: 42,
    fat: 6.5,
    fib: 1.8,
    allergens: [],
  },
  {
    foodName: 'Bánh mì thịt nguội',
    cat: 'Bánh mì',
    cal: 260,
    pro: 12,
    carb: 35,
    fat: 8.5,
    fib: 2.0,
    allergens: ['Gluten', 'Egg'],
  },
  {
    foodName: 'Cháo đậu xanh',
    cat: 'Cháo',
    cal: 105,
    pro: 5,
    carb: 20,
    fat: 1.0,
    fib: 3.5,
    allergens: [],
  },
  {
    foodName: 'Nem rán (chả giò)',
    cat: 'Nem & Cuốn',
    cal: 220,
    pro: 8,
    carb: 22,
    fat: 11,
    fib: 1.5,
    allergens: ['Gluten', 'Egg'],
  },
  {
    foodName: 'Bún riêu cua',
    cat: 'Bún',
    cal: 185,
    pro: 14,
    carb: 22,
    fat: 5.0,
    fib: 1.5,
    allergens: ['Shellfish'],
  },
  // Group D — HIGH CARB
  {
    foodName: 'Cơm gà Hội An',
    cat: 'Cơm bowl',
    cal: 440,
    pro: 22,
    carb: 62,
    fat: 12,
    fib: 2.0,
    allergens: [],
  },
  {
    foodName: 'Bún mắm',
    cat: 'Bún',
    cal: 350,
    pro: 20,
    carb: 45,
    fat: 10,
    fib: 2.5,
    allergens: ['Fish', 'Shellfish'],
  },
  {
    foodName: 'Mì xào hải sản',
    cat: 'Mì',
    cal: 420,
    pro: 18,
    carb: 58,
    fat: 14,
    fib: 2.0,
    allergens: ['Gluten', 'Shellfish'],
  },
  {
    foodName: 'Xôi xéo',
    cat: 'Bánh & Xôi',
    cal: 320,
    pro: 8,
    carb: 58,
    fat: 7.0,
    fib: 2.5,
    allergens: [],
  },
  {
    foodName: 'Bánh bao nhân thịt',
    cat: 'Bánh mì',
    cal: 285,
    pro: 12,
    carb: 42,
    fat: 8.0,
    fib: 1.5,
    allergens: ['Gluten'],
  },
  {
    foodName: 'Bánh mì chả cá',
    cat: 'Bánh mì',
    cal: 270,
    pro: 14,
    carb: 36,
    fat: 7.5,
    fib: 1.8,
    allergens: ['Gluten', 'Fish'],
  },
  {
    foodName: 'Cháo lòng',
    cat: 'Cháo',
    cal: 155,
    pro: 12,
    carb: 18,
    fat: 5.5,
    fib: 0.8,
    allergens: [],
  },
  {
    foodName: 'Bún thịt nướng',
    cat: 'Bún',
    cal: 365,
    pro: 22,
    carb: 48,
    fat: 9.5,
    fib: 2.5,
    allergens: [],
  },
  // Group E — SNACK
  {
    foodName: 'Chè đậu đỏ',
    cat: 'Chè & Tráng miệng',
    cal: 145,
    pro: 4,
    carb: 30,
    fat: 1.5,
    fib: 4.0,
    allergens: [],
  },
  {
    foodName: 'Chè trôi nước',
    cat: 'Chè & Tráng miệng',
    cal: 195,
    pro: 3,
    carb: 38,
    fat: 4.5,
    fib: 2.0,
    allergens: [],
  },
  {
    foodName: 'Sinh tố bơ',
    cat: 'Nước uống',
    cal: 185,
    pro: 3,
    carb: 15,
    fat: 13,
    fib: 5.0,
    allergens: [],
  },
  {
    foodName: 'Nước mía',
    cat: 'Nước uống',
    cal: 75,
    pro: 0.5,
    carb: 18,
    fat: 0.2,
    fib: 0.3,
    allergens: [],
  },
  {
    foodName: 'Bánh bèo',
    cat: 'Bánh & Xôi',
    cal: 125,
    pro: 4,
    carb: 22,
    fat: 3.0,
    fib: 0.8,
    allergens: [],
  },
  {
    foodName: 'Trà sữa trân châu',
    cat: 'Nước uống',
    cal: 280,
    pro: 4,
    carb: 52,
    fat: 6.5,
    fib: 0.5,
    allergens: ['Dairy'],
  },
  {
    foodName: 'Bánh tráng trộn',
    cat: 'Chè & Tráng miệng',
    cal: 195,
    pro: 5,
    carb: 32,
    fat: 6.5,
    fib: 2.0,
    allergens: [],
  },
  {
    foodName: 'Gỏi cuốn chay',
    cat: 'Nem & Cuốn',
    cal: 80,
    pro: 4,
    carb: 14,
    fat: 1.5,
    fib: 2.8,
    allergens: [],
  },
  // Group F — NEW ITEMS (createdAt = now - 2 days)
  {
    foodName: 'Bún đậu mắm tôm',
    cat: 'Bún',
    cal: 310,
    pro: 16,
    carb: 38,
    fat: 10,
    fib: 2.5,
    allergens: [],
    isNew: true,
  },
  {
    foodName: 'Cơm tấm chả trứng',
    cat: 'Cơm',
    cal: 395,
    pro: 24,
    carb: 50,
    fat: 10,
    fib: 1.8,
    allergens: ['Egg'],
    isNew: true,
  },
  {
    foodName: 'Phở cuốn',
    cat: 'Phở',
    cal: 175,
    pro: 14,
    carb: 22,
    fat: 4.0,
    fib: 1.5,
    allergens: [],
    isNew: true,
  },
  {
    foodName: 'Bánh mì chảo',
    cat: 'Bánh mì',
    cal: 430,
    pro: 18,
    carb: 42,
    fat: 20,
    fib: 1.5,
    allergens: ['Gluten', 'Egg'],
    isNew: true,
  },
  {
    foodName: 'Chả cá Lã Vọng',
    cat: 'Gỏi & Salad',
    cal: 240,
    pro: 28,
    carb: 8,
    fat: 12,
    fib: 1.0,
    allergens: ['Fish'],
    isNew: true,
  },
  // Group G — EDGE CASES
  {
    foodName: '[Dummy - No Nutrition]',
    cat: 'Cháo',
    cal: 0,
    pro: 0,
    carb: 0,
    fat: 0,
    fib: 0,
    allergens: [],
  },
  {
    foodName: '[Dummy - All Allergens]',
    cat: 'Cháo',
    cal: 200,
    pro: 10,
    carb: 20,
    fat: 8,
    fib: 1,
    allergens: ['Peanut', 'Gluten', 'Dairy', 'Egg', 'Shellfish', 'Fish'],
  },
  {
    foodName: 'Bánh tráng nướng',
    cat: 'Bánh & Xôi',
    cal: 155,
    pro: 3,
    carb: 28,
    fat: 4,
    fib: 1.5,
    allergens: [],
  },
  {
    foodName: 'Bánh ướt',
    cat: 'Bánh & Xôi',
    cal: 130,
    pro: 4,
    carb: 24,
    fat: 3,
    fib: 0.8,
    allergens: [],
  },
  {
    foodName: 'Bánh khọt',
    cat: 'Bánh & Xôi',
    cal: 185,
    pro: 6,
    carb: 22,
    fat: 8,
    fib: 1.0,
    allergens: [],
  },
];

// ─── GOAL CONFIG ──────────────────────────────────────────────────────────────

const GOAL_CONFIG = {
  GOAL_LOSS: {
    calories: 1600,
    protein: 120,
    carbs: 160,
    fat: 50,
    fiber: 25,
    targetWeight: 55,
  },
  GOAL_GAIN: {
    calories: 2800,
    protein: 160,
    carbs: 350,
    fat: 90,
    fiber: 20,
    targetWeight: 75,
  },
  GOAL_MAINTAIN: {
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 65,
    fiber: 25,
    targetWeight: 65,
  },
  GOAL_STRICT: {
    calories: 1500,
    protein: 130,
    carbs: 140,
    fat: 45,
    fiber: 30,
    targetWeight: 60,
  },
};

// ─── CLUSTER CONFIG ───────────────────────────────────────────────────────────

// All preferred food names per cluster (used to scope Phase 6 vs 7)
const CLUSTER_CONFIG = {
  A: {
    goal: 'GOAL_LOSS',
    preferredFoods: [
      'Gỏi cuốn tôm thịt',
      'Nộm đu đủ bò khô',
      'Rau muống xào tỏi',
      'Súp bí đỏ',
      'Gỏi gà bắp cải',
      'Canh khổ qua dồn thịt',
      'Cháo đậu xanh',
      'Gỏi cuốn chay',
    ],
    mealDist: {
      MEAL_BREAKFAST: 0.2,
      MEAL_LUNCH: 0.45,
      MEAL_DINNER: 0.35,
      MEAL_SNACK: 0.0,
    },
    count: 12,
  },
  B: {
    goal: 'GOAL_MAINTAIN',
    preferredFoods: [
      'Phở bò tái',
      'Bún bò Huế',
      'Phở gà',
      'Mì Quảng',
      'Hủ tiếu Nam Vang',
      'Bún riêu cua',
      'Bún thịt nướng',
    ],
    mealDist: {
      MEAL_BREAKFAST: 0.4,
      MEAL_LUNCH: 0.45,
      MEAL_DINNER: 0.15,
      MEAL_SNACK: 0.0,
    },
    count: 12,
  },
  C: {
    goal: 'GOAL_GAIN',
    preferredFoods: [
      'Cơm tấm sườn bì chả',
      'Gà nướng lá chanh',
      'Bò lúc lắc',
      'Cơm gà Hội An',
      'Mì xào hải sản',
      'Bún thịt nướng',
    ],
    mealDist: {
      MEAL_BREAKFAST: 0.1,
      MEAL_LUNCH: 0.45,
      MEAL_DINNER: 0.45,
      MEAL_SNACK: 0.0,
    },
    count: 12,
  },
  D: {
    goal: 'GOAL_MAINTAIN',
    preferredFoods: [
      'Bánh cuốn nhân thịt',
      'Xôi gà',
      'Bánh mì thịt nguội',
      'Chè đậu đỏ',
      'Chè trôi nước',
      'Bánh bèo',
      'Bánh tráng trộn',
    ],
    mealDist: {
      MEAL_BREAKFAST: 0.35,
      MEAL_LUNCH: 0.1,
      MEAL_DINNER: 0.05,
      MEAL_SNACK: 0.5,
    },
    count: 9,
  },
  E: {
    goal: 'GOAL_STRICT',
    preferredFoods: [
      'Canh chua cá',
      'Rau muống xào tỏi',
      'Súp bí đỏ',
      'Gỏi gà bắp cải',
      'Canh khổ qua dồn thịt',
      'Gỏi cuốn chay',
    ],
    mealDist: {
      MEAL_BREAKFAST: 0.2,
      MEAL_LUNCH: 0.5,
      MEAL_DINNER: 0.3,
      MEAL_SNACK: 0.0,
    },
    count: 5,
  },
};

// ─── AFFINITY SEED (global — for foods NOT in any cluster preferred list) ─────
// food_id-less: keyed by foodName, counts per meal type
const MEAL_AFFINITY_SEED: Record<string, Record<string, number>> = {
  'Phở bò tái': { BREAKFAST: 60, LUNCH: 30, DINNER: 5, SNACK: 5 },
  'Bún bò Huế': { BREAKFAST: 55, LUNCH: 35, DINNER: 5, SNACK: 5 },
  'Cơm tấm sườn bì chả': { BREAKFAST: 5, LUNCH: 50, DINNER: 40, SNACK: 5 },
  'Gà nướng lá chanh': { BREAKFAST: 5, LUNCH: 25, DINNER: 65, SNACK: 5 },
  'Cháo gà': { BREAKFAST: 80, LUNCH: 5, DINNER: 5, SNACK: 10 },
  'Xôi gà': { BREAKFAST: 75, LUNCH: 5, DINNER: 5, SNACK: 15 },
  'Chè đậu đỏ': { BREAKFAST: 5, LUNCH: 5, DINNER: 5, SNACK: 85 },
  'Trà sữa trân châu': { BREAKFAST: 0, LUNCH: 5, DINNER: 5, SNACK: 90 },
  'Sinh tố bơ': { BREAKFAST: 15, LUNCH: 5, DINNER: 5, SNACK: 75 },
  'Nước mía': { BREAKFAST: 5, LUNCH: 20, DINNER: 5, SNACK: 70 },
};

// All preferred food names across all clusters (to exclude from Phase 6)
const ALL_CLUSTER_PREFERRED = new Set(
  Object.values(CLUSTER_CONFIG).flatMap((c) => c.preferredFoods),
);

// ─── TOP POPULAR FOOD NAMES (for popularity boost) ────────────────────────────
const TOP_POPULAR_FOOD_NAMES = [
  'Phở bò tái',
  'Bún bò Huế',
  'Cơm tấm sườn bì chả',
  'Phở gà',
  'Mì Quảng',
  'Hủ tiếu Nam Vang',
  'Cơm chiên dương châu',
  'Xôi gà',
  'Bánh mì thịt nguội',
  'Cơm gà Hội An',
  'Xôi xéo',
  'Bún thịt nướng',
  'Gà nướng lá chanh',
  'Bò lúc lắc',
  'Gỏi cuốn tôm thịt',
  'Nộm đu đủ bò khô',
  'Gỏi gà bắp cải',
  'Bánh cuốn nhân thịt',
  'Nem rán (chả giò)',
  'Bún riêu cua',
  'Cháo lòng',
  'Chè đậu đỏ',
  'Sinh tố bơ',
  'Bánh tráng trộn',
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function noise(pct = 0.05): number {
  return 1 + (Math.random() * 2 - 1) * pct;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function dateOnly(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

async function getOrCreateDailyLog(
  prisma: PrismaService,
  userId: number,
  logDate: Date,
) {
  const date = dateOnly(logDate);
  return prisma.dailyLog.upsert({
    where: { userId_logDate: { userId, logDate: date } },
    update: {},
    create: { userId, logDate: date, status: 'STATUS_BELOW' },
  });
}

async function createMealWithItems(
  prisma: PrismaService,
  userId: number,
  logDate: Date,
  mealType: string,
  items: {
    foodId: number;
    cal: number;
    pro: number;
    carb: number;
    fat: number;
    fib: number;
    qty?: number;
  }[],
) {
  const log = await getOrCreateDailyLog(prisma, userId, logDate);
  const meal = await prisma.meal.create({
    data: { dailyLogId: log.id, mealType, mealDateTime: logDate },
  });
  for (const item of items) {
    await prisma.mealItem.create({
      data: {
        mealId: meal.id,
        foodId: item.foodId,
        quantity: item.qty ?? 1.0,
        grams: (item.qty ?? 1.0) * 100, // Giả định 100g mỗi phần nếu không có defaultServingGrams
        calories: item.cal,
        protein: item.pro,
        carbs: item.carb,
        fat: item.fat,
        fiber: item.fib,
      },
    });
  }
  return meal;
}

// ─── MAIN SEED ────────────────────────────────────────────────────────────────

async function runControlledSeed() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);

  console.log('Starting Controlled Seed (v2)...');

  // Pre-hash password for all users
  const hashedPassword = await bcrypt.hash('123456', 10);

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Master Data
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 1: Master Data...');

    for (const n of NUTRIENTS) {
      await prisma.nutrient.upsert({
        where: { name: n.name },
        update: {},
        create: n as any,
      });
    }
    const dbNutrients = await prisma.nutrient.findMany();
    const NUTRIENT_ID: Record<string, number> = Object.fromEntries(
      dbNutrients.map((n) => [n.name, n.id]),
    );

    for (const name of ALLERGEN_NAMES) {
      await prisma.allergen.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
    const dbAllergens = await prisma.allergen.findMany();
    const ALLERGEN_ID: Record<string, number> = Object.fromEntries(
      dbAllergens.map((a) => [a.name, a.id]),
    );

    for (const name of CATEGORY_NAMES) {
      await prisma.foodCategory.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
    const dbCategories = await prisma.foodCategory.findMany();
    const CATEGORY_ID: Record<string, number> = Object.fromEntries(
      dbCategories.map((c) => [c.name, c.id]),
    );

    console.log('Phase 1 done');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: Foods (65 fixed)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 2: Foods (65 fixed)...');

    const FOOD_ID: Record<string, number> = {};
    const newItemDate = daysAgo(2);

    for (const f of FOODS_FIXED) {
      const existing = await prisma.food.findFirst({
        where: { foodName: f.foodName },
      });
      let food: { id: number };
      if (existing) {
        food = existing;
      } else {
        food = await prisma.food.create({
          data: {
            foodName: f.foodName,
            categoryId: CATEGORY_ID[f.cat] ?? null,
            createdAt: (f as any).isNew ? newItemDate : undefined,
            nutritionProfile: {
              create: {
                source: 'SRC_MANUAL',
                values: {
                  create: [
                    { nutrientId: NUTRIENT_ID['Calories'], value: f.cal },
                    { nutrientId: NUTRIENT_ID['Protein'], value: f.pro },
                    { nutrientId: NUTRIENT_ID['Carbohydrates'], value: f.carb },
                    { nutrientId: NUTRIENT_ID['Fat'], value: f.fat },
                    { nutrientId: NUTRIENT_ID['Fiber'], value: f.fib },
                  ],
                },
              },
            },
          },
        });
      }
      FOOD_ID[f.foodName] = food.id;
    }

    console.log(`Phase 2 done — ${Object.keys(FOOD_ID).length} foods`);

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3: Ingredients + Allergen Links
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 3: Ingredient allergen links...');

    // Create one ingredient per allergen type, then link to relevant foods
    const INGREDIENT_ID: Record<string, number> = {};
    for (const allergenName of [
      'Egg',
      'Shellfish',
      'Fish',
      'Gluten',
      'Dairy',
      'Peanut',
    ]) {
      const ingName = `${allergenName} ingredient (seed)`;
      let ing = await prisma.ingredient.findFirst({
        where: { ingredientName: ingName },
      });
      if (!ing) {
        ing = await prisma.ingredient.create({
          data: { ingredientName: ingName },
        });
        await prisma.ingredientAllergen.create({
          data: { ingredientId: ing.id, allergenId: ALLERGEN_ID[allergenName] },
        });
      }
      INGREDIENT_ID[allergenName] = ing.id;
    }

    // Link ingredients to foods based on allergen list in FOODS_FIXED
    for (const f of FOODS_FIXED) {
      const foodId = FOOD_ID[f.foodName];
      if (!foodId) continue;
      for (const allergenName of f.allergens) {
        const ingId = INGREDIENT_ID[allergenName];
        if (!ingId) continue;
        const exists = await prisma.foodIngredient.findFirst({
          where: { foodId, ingredientId: ingId },
        });
        if (!exists) {
          await prisma.foodIngredient.create({
            data: { foodId, ingredientId: ingId, quantityGrams: 10 },
          });
        }
      }
    }

    console.log('Phase 3 done');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4: Special Users SC01–SC10
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 4: Special users SC01–SC10...');

    // Helper: upsert user with profile + goal
    async function upsertSpecialUser(opts: {
      email: string;
      fullName: string;
      goalType: string;
      targetCalories: number;
      targetProtein: number;
      targetCarbs: number;
      targetFat: number;
      targetFiber: number;
      targetWeight?: number;
      age?: number;
      weight?: number;
    }) {
      const goal = GOAL_CONFIG[opts.goalType as keyof typeof GOAL_CONFIG];
      return prisma.user.upsert({
        where: { email: opts.email },
        update: {},
        create: {
          email: opts.email,
          password: hashedPassword,
          fullName: opts.fullName,
          userProfile: {
            create: {
              age: opts.age ?? 28,
              height: 168,
              weight: opts.weight ?? 65,
              bmi: 23.0,
              bmr: 1550,
              tdee: 2000,
              gender: 'male',
              activityLevel: 'ACT_MODERATE',
            },
          },
          nutritionGoals: {
            create: {
              goalType: opts.goalType,
              status: 'NUTR_GOAL_ONGOING',
              targetWeight: opts.targetWeight ?? goal.targetWeight,
              targetCalories: opts.targetCalories,
              targetProtein: opts.targetProtein,
              targetCarbs: opts.targetCarbs,
              targetFat: opts.targetFat,
              targetFiber: opts.targetFiber,
              startDate: daysAgo(30),
              endDate: daysAgo(-30),
            },
          },
        },
      });
    }

    // Helper: seed meals to reach a consumed target (greedy food fill)
    async function seedConsumedMeals(
      userId: number,
      mealType: string,
      targetCal: number,
      foodPool: string[],
    ) {
      let totalCal = 0;
      const items: any[] = [];
      for (const fname of foodPool) {
        if (totalCal >= targetCal * 0.95) break;
        const fid = FOOD_ID[fname];
        if (!fid) continue;
        const fd = FOODS_FIXED.find((f) => f.foodName === fname);
        if (!fd || fd.cal === 0) continue;
        const qty = Math.max(
          0.5,
          Math.min(2.0, (targetCal - totalCal) / fd.cal),
        );
        items.push({
          foodId: fid,
          qty,
          cal: parseFloat((fd.cal * qty).toFixed(2)),
          pro: parseFloat((fd.pro * qty).toFixed(2)),
          carb: parseFloat((fd.carb * qty).toFixed(2)),
          fat: parseFloat((fd.fat * qty).toFixed(2)),
          fib: parseFloat((fd.fib * qty).toFixed(2)),
        });
        totalCal += fd.cal * qty;
      }
      if (items.length > 0) {
        await createMealWithItems(prisma, userId, new Date(), mealType, items);
      }
    }

    // Helper: seed past logs for total_logs count
    async function seedPastLogs(
      userId: number,
      count: number,
      foodNames: string[],
    ) {
      for (let d = 1; d <= count; d++) {
        const date = daysAgo(d);
        for (const mt of ['MEAL_BREAKFAST', 'MEAL_LUNCH', 'MEAL_DINNER']) {
          const fname = foodNames[d % foodNames.length];
          const fid = FOOD_ID[fname];
          if (!fid) continue;
          const fd = FOODS_FIXED.find((f) => f.foodName === fname)!;
          await createMealWithItems(prisma, userId, date, mt, [
            {
              foodId: fid,
              qty: 1,
              cal: fd.cal,
              pro: fd.pro,
              carb: fd.carb,
              fat: fd.fat,
              fib: fd.fib,
            },
          ]);
        }
      }
    }

    // SC01 — Perfect match content score (cold-start, GOAL_LOSS)
    // target=[1600,120,160,50,25] remaining=[500,30,45,12,10] → consumed≈[1100,90,115,38,15]
    const sc01 = await upsertSpecialUser({
      email: 'sc01@seed.test',
      fullName: 'SC01 Content Score',
      goalType: 'GOAL_LOSS',
      targetCalories: 1600,
      targetProtein: 120,
      targetCarbs: 160,
      targetFat: 50,
      targetFiber: 25,
    });
    await seedConsumedMeals(sc01.id, 'MEAL_BREAKFAST', 400, [
      'Cháo gà',
      'Bánh cuốn nhân thịt',
    ]);
    await seedConsumedMeals(sc01.id, 'MEAL_LUNCH', 450, [
      'Gỏi gà bắp cải',
      'Canh khổ qua dồn thịt',
      'Phở gà',
    ]);
    await seedConsumedMeals(sc01.id, 'MEAL_DINNER', 250, [
      'Gỏi cuốn tôm thịt',
      'Nộm đu đủ bò khô',
    ]);
    await seedPastLogs(sc01.id, 5, ['Phở gà', 'Gỏi gà bắp cải', 'Cháo gà']);

    // SC02 — Allergy hard block (heavy, Shellfish + Fish)
    const sc02 = await upsertSpecialUser({
      email: 'sc02@seed.test',
      fullName: 'SC02 Allergy Block',
      goalType: 'GOAL_MAINTAIN',
      targetCalories: 2000,
      targetProtein: 100,
      targetCarbs: 250,
      targetFat: 65,
      targetFiber: 25,
    });
    await seedConsumedMeals(sc02.id, 'MEAL_BREAKFAST', 400, [
      'Phở gà',
      'Cháo gà',
    ]);
    await seedConsumedMeals(sc02.id, 'MEAL_LUNCH', 400, [
      'Gỏi gà bắp cải',
      'Cơm tấm sườn bì chả',
    ]);
    await seedConsumedMeals(sc02.id, 'MEAL_DINNER', 400, [
      'Gà nướng lá chanh',
      'Rau muống xào tỏi',
    ]);
    // Add allergies
    for (const allergenName of ['Shellfish', 'Fish']) {
      await prisma.userAllergy.upsert({
        where: {
          userId_allergenId: {
            userId: sc02.id,
            allergenId: ALLERGEN_ID[allergenName],
          },
        },
        update: {},
        create: {
          userId: sc02.id,
          allergenId: ALLERGEN_ID[allergenName],
          severity: 'SEV_HIGH',
        },
      });
    }
    await seedPastLogs(sc02.id, 80, [
      'Phở bò tái',
      'Phở gà',
      'Gỏi gà bắp cải',
      'Bò lúc lắc',
    ]);

    // SC03 — Repeat penalty max (heavy, repeat food_id=1 × 3)
    const sc03 = await upsertSpecialUser({
      email: 'sc03@seed.test',
      fullName: 'SC03 Repeat Penalty',
      goalType: 'GOAL_MAINTAIN',
      targetCalories: 2000,
      targetProtein: 100,
      targetCarbs: 250,
      targetFat: 65,
      targetFiber: 25,
    });
    await seedConsumedMeals(sc03.id, 'MEAL_BREAKFAST', 500, ['Phở gà']);
    await seedConsumedMeals(sc03.id, 'MEAL_LUNCH', 400, [
      'Gỏi gà bắp cải',
      'Rau muống xào tỏi',
    ]);
    // Seed repeat history: Phở bò tái × 3, Bún bò Huế × 2, Phở gà × 1 in recent days
    for (let i = 0; i < 3; i++) {
      const fid = FOOD_ID['Phở bò tái'];
      const fd = FOODS_FIXED.find((f) => f.foodName === 'Phở bò tái')!;
      await createMealWithItems(
        prisma,
        sc03.id,
        daysAgo(i + 1),
        'MEAL_BREAKFAST',
        [
          {
            foodId: fid,
            qty: 1,
            cal: fd.cal,
            pro: fd.pro,
            carb: fd.carb,
            fat: fd.fat,
            fib: fd.fib,
          },
        ],
      );
    }
    for (let i = 0; i < 2; i++) {
      const fid = FOOD_ID['Bún bò Huế'];
      const fd = FOODS_FIXED.find((f) => f.foodName === 'Bún bò Huế')!;
      await createMealWithItems(
        prisma,
        sc03.id,
        daysAgo(i + 4),
        'MEAL_BREAKFAST',
        [
          {
            foodId: fid,
            qty: 1,
            cal: fd.cal,
            pro: fd.pro,
            carb: fd.carb,
            fat: fd.fat,
            fib: fd.fib,
          },
        ],
      );
    }
    await seedPastLogs(sc03.id, 90, [
      'Phở bò tái',
      'Bún bò Huế',
      'Phở gà',
      'Gà nướng lá chanh',
    ]);

    // SC04 — Popular fallback (cold-start, remaining = full target = zeros consumed)
    await upsertSpecialUser({
      email: 'sc04@seed.test',
      fullName: 'SC04 Popular Fallback',
      goalType: 'GOAL_MAINTAIN',
      targetCalories: 2000,
      targetProtein: 100,
      targetCarbs: 250,
      targetFat: 65,
      targetFiber: 25,
    });
    // No meals today → remaining = target (non-zero), but with zero history CF won't trigger

    // SC05 — Affinity threshold fallback (moderate, SNACK meal)
    const sc05 = await upsertSpecialUser({
      email: 'sc05@seed.test',
      fullName: 'SC05 Threshold Fallback',
      goalType: 'GOAL_MAINTAIN',
      targetCalories: 2000,
      targetProtein: 100,
      targetCarbs: 250,
      targetFat: 65,
      targetFiber: 25,
    });
    await seedPastLogs(sc05.id, 10, ['Phở gà', 'Gỏi gà bắp cải']);

    // SC06 — New item injection (moderate, GOAL_LOSS)
    // target=[1600,120,160,50,25] remaining=[400,25,50,12,10] → consumed≈[1200,95,110,38,15]
    const sc06 = await upsertSpecialUser({
      email: 'sc06@seed.test',
      fullName: 'SC06 New Item Injection',
      goalType: 'GOAL_LOSS',
      targetCalories: 1600,
      targetProtein: 120,
      targetCarbs: 160,
      targetFat: 50,
      targetFiber: 25,
    });
    await seedConsumedMeals(sc06.id, 'MEAL_BREAKFAST', 400, [
      'Cháo gà',
      'Cháo đậu xanh',
    ]);
    await seedConsumedMeals(sc06.id, 'MEAL_LUNCH', 450, [
      'Gỏi gà bắp cải',
      'Canh khổ qua dồn thịt',
    ]);
    await seedConsumedMeals(sc06.id, 'MEAL_DINNER', 350, [
      'Gỏi cuốn tôm thịt',
      'Rau muống xào tỏi',
    ]);
    await seedPastLogs(sc06.id, 15, [
      'Phở gà',
      'Gỏi gà bắp cải',
      'Rau muống xào tỏi',
    ]);

    // SC07 — Diversity rerank (moderate, strong preference for Bánh & Xôi)
    const sc07 = await upsertSpecialUser({
      email: 'sc07@seed.test',
      fullName: 'SC07 Diversity Cat Cap',
      goalType: 'GOAL_MAINTAIN',
      targetCalories: 2000,
      targetProtein: 100,
      targetCarbs: 250,
      targetFat: 65,
      targetFiber: 25,
    });
    // Seed heavy history for all Bánh & Xôi foods to boost CF score
    const banhXoiFoods = [
      'Bánh cuốn nhân thịt',
      'Xôi gà',
      'Xôi xéo',
      'Bánh bèo',
      'Bánh tráng nướng',
      'Bánh ướt',
      'Bánh khọt',
    ];
    for (let d = 1; d <= 20; d++) {
      const fname = banhXoiFoods[d % banhXoiFoods.length];
      const fid = FOOD_ID[fname];
      if (!fid) continue;
      const fd = FOODS_FIXED.find((f) => f.foodName === fname)!;
      await createMealWithItems(prisma, sc07.id, daysAgo(d), 'MEAL_BREAKFAST', [
        {
          foodId: fid,
          qty: 1,
          cal: fd.cal,
          pro: fd.pro,
          carb: fd.carb,
          fat: fd.fat,
          fib: fd.fib,
        },
      ]);
    }

    // SC08 — Hybrid strategy (Cluster B, heavy)
    // target=[2000,100,250,65,25] remaining=[700,35,90,22,15] → consumed≈[1300,65,160,43,10]
    const sc08 = await upsertSpecialUser({
      email: 'sc08@seed.test',
      fullName: 'SC08 Hybrid CF',
      goalType: 'GOAL_MAINTAIN',
      targetCalories: 2000,
      targetProtein: 100,
      targetCarbs: 250,
      targetFat: 65,
      targetFiber: 25,
    });
    await seedConsumedMeals(sc08.id, 'MEAL_BREAKFAST', 500, [
      'Phở bò tái',
      'Phở gà',
    ]);
    await seedConsumedMeals(sc08.id, 'MEAL_LUNCH', 500, [
      'Bún bò Huế',
      'Bún riêu cua',
    ]);
    await seedConsumedMeals(sc08.id, 'MEAL_DINNER', 300, ['Hủ tiếu Nam Vang']);
    await seedPastLogs(sc08.id, 85, [
      'Phở bò tái',
      'Bún bò Huế',
      'Phở gà',
      'Mì Quảng',
      'Hủ tiếu Nam Vang',
    ]);

    // SC10 — STRICT_DIET weight shift (Cluster E, heavy)
    // target=[1500,130,140,45,30] remaining=[300,20,35,8,10] → consumed≈[1200,110,105,37,20]
    const sc10 = await upsertSpecialUser({
      email: 'sc10@seed.test',
      fullName: 'SC10 Strict Diet',
      goalType: 'GOAL_STRICT',
      targetCalories: 1500,
      targetProtein: 130,
      targetCarbs: 140,
      targetFat: 45,
      targetFiber: 30,
    });
    await seedConsumedMeals(sc10.id, 'MEAL_BREAKFAST', 400, [
      'Cháo gà',
      'Gỏi cuốn chay',
    ]);
    await seedConsumedMeals(sc10.id, 'MEAL_LUNCH', 500, [
      'Canh chua cá',
      'Gỏi gà bắp cải',
      'Canh khổ qua dồn thịt',
    ]);
    await seedConsumedMeals(sc10.id, 'MEAL_DINNER', 300, [
      'Rau muống xào tỏi',
      'Súp bí đỏ',
    ]);
    await seedPastLogs(sc10.id, 75, [
      'Canh khổ qua dồn thịt',
      'Gỏi gà bắp cải',
      'Rau muống xào tỏi',
      'Gỏi cuốn chay',
    ]);

    console.log('Phase 4 done — special users SC01–SC10');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 5: Cluster Users (50)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 5: Cluster users...');

    let clusterUserIdx = 0;
    const clusterUsers: {
      userId: number;
      cluster: string;
      preferredFoods: string[];
      mealDist: Record<string, number>;
      logCount: number;
    }[] = [];

    for (const [clusterKey, cfg] of Object.entries(CLUSTER_CONFIG)) {
      for (let i = 0; i < cfg.count; i++) {
        const email = `cluster_${clusterKey.toLowerCase()}_${String(clusterUserIdx).padStart(3, '0')}@seed.test`;
        const isHeavy = i < Math.floor(cfg.count * 0.5); // 50% heavy, 50% moderate
        const tier = isHeavy ? 'heavy' : 'moderate';
        const logCount =
          tier === 'heavy'
            ? 61 + Math.floor(Math.random() * 60)
            : 10 + Math.floor(Math.random() * 30);
        const goalCfg = GOAL_CONFIG[cfg.goal as keyof typeof GOAL_CONFIG];

        const u = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            password: hashedPassword,
            fullName: `Cluster ${clusterKey} User ${clusterUserIdx}`,
            userProfile: {
              create: {
                age: 22 + Math.floor(Math.random() * 20),
                height: 155 + Math.random() * 25,
                weight: 48 + Math.random() * 40,
                bmi: 21 + Math.random() * 5,
                bmr: 1400 + Math.random() * 400,
                tdee: 1800 + Math.random() * 600,
                gender: i % 2 === 0 ? 'female' : 'male',
                activityLevel: 'ACT_MODERATE',
              },
            },
            nutritionGoals: {
              create: {
                goalType: cfg.goal,
                status: 'NUTR_GOAL_ONGOING',
                targetWeight: goalCfg.targetWeight * noise(0.02),
                targetCalories: goalCfg.calories * noise(0.05),
                targetProtein: goalCfg.protein * noise(0.05),
                targetCarbs: goalCfg.carbs * noise(0.05),
                targetFat: goalCfg.fat * noise(0.05),
                targetFiber: goalCfg.fiber * noise(0.05),
                startDate: daysAgo(30),
                endDate: daysAgo(-30),
              },
            },
          },
        });
        clusterUsers.push({
          userId: u.id,
          cluster: clusterKey,
          preferredFoods: cfg.preferredFoods,
          mealDist: cfg.mealDist,
          logCount,
        });
        clusterUserIdx++;
      }
    }

    console.log(`Phase 5 done — ${clusterUsers.length} cluster users`);

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 6: Affinity History (NON-cluster-preferred foods only)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 6: Affinity signal (non-cluster foods)...');

    // Create a small pool of "affinity seeder" users (cold-start, no cluster)
    const affinityUsersCount = 10;
    const affinityUserIds: number[] = [];
    for (let i = 0; i < affinityUsersCount; i++) {
      const email = `affinity_pool_${String(i).padStart(3, '0')}@seed.test`;
      const u = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: hashedPassword,
          fullName: `Affinity Pool ${i}`,
          userProfile: {
            create: {
              age: 25,
              height: 165,
              weight: 60,
              bmi: 22,
              bmr: 1500,
              tdee: 2000,
              activityLevel: 'ACT_SEDENTARY',
            },
          },
        },
      });
      affinityUserIds.push(u.id);
    }

    // For each food in MEAL_AFFINITY_SEED that is NOT in cluster preferred list, seed meal items
    for (const [foodName, mealCounts] of Object.entries(MEAL_AFFINITY_SEED)) {
      if (ALL_CLUSTER_PREFERRED.has(foodName)) continue; // Skip — Phase 7 handles these

      const fid = FOOD_ID[foodName];
      if (!fid) continue;
      const fd = FOODS_FIXED.find((f) => f.foodName === foodName)!;
      if (!fd) continue;

      let dayOffset = 1;
      for (const [mtStr, count] of Object.entries(mealCounts)) {
        const mt = mtStr;
        for (let n = 0; n < count; n++) {
          const uid = affinityUserIds[n % affinityUserIds.length];
          await createMealWithItems(prisma, uid, daysAgo(dayOffset), mt, [
            {
              foodId: fid,
              qty: 1,
              cal: fd.cal,
              pro: fd.pro,
              carb: fd.carb,
              fat: fd.fat,
              fib: fd.fib,
            },
          ]);
          dayOffset++;
        }
      }
    }

    console.log('Phase 6 done');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 7: Cluster History (preferred foods — CF signal)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 7: Cluster history (CF signal)...');

    for (const cu of clusterUsers) {
      const allFoodNames = Object.keys(FOOD_ID);
      const otherFoods = allFoodNames.filter(
        (fn) => !cu.preferredFoods.includes(fn) && FOOD_ID[fn],
      );

      for (let d = 1; d <= cu.logCount; d++) {
        const logDate = daysAgo(d);
        // Determine meal types for this day based on mealDist
        const mealTypesToSeed: string[] = [];
        for (const [mt, prob] of Object.entries(cu.mealDist)) {
          if (prob > 0 && Math.random() < prob * 2) mealTypesToSeed.push(mt);
        }
        if (mealTypesToSeed.length === 0) mealTypesToSeed.push('MEAL_LUNCH');

        for (const mt of mealTypesToSeed) {
          // 70% from preferred foods, 30% from others
          const usePreferred = Math.random() < 0.7;
          const pool =
            usePreferred && cu.preferredFoods.length > 0
              ? cu.preferredFoods
              : otherFoods;
          const foodName = pool[Math.floor(Math.random() * pool.length)];
          const fid = FOOD_ID[foodName];
          if (!fid) continue;
          const fd = FOODS_FIXED.find((f) => f.foodName === foodName)!;
          if (!fd) continue;
          await createMealWithItems(prisma, cu.userId, logDate, mt, [
            {
              foodId: fid,
              qty: 1,
              cal: fd.cal,
              pro: fd.pro,
              carb: fd.carb,
              fat: fd.fat,
              fib: fd.fib,
            },
          ]);
        }
      }
    }

    console.log('Phase 7 done');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 8: Popularity Boost (anonymous user pool)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 8: Popularity boost...');

    const POP_BOOST_COUNT = 10;
    const popUserIds: number[] = [];
    for (let i = 0; i < POP_BOOST_COUNT; i++) {
      const email = `pop_boost_${String(i + 1).padStart(3, '0')}@seed.test`;
      const u = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: hashedPassword,
          fullName: `Pop Boost User ${i + 1}`,
          userProfile: {
            create: {
              age: 30,
              height: 170,
              weight: 70,
              bmi: 24,
              bmr: 1600,
              tdee: 2200,
              activityLevel: 'ACT_LIGHT',
            },
          },
        },
      });
      popUserIds.push(u.id);
    }

    for (const foodName of TOP_POPULAR_FOOD_NAMES) {
      const fid = FOOD_ID[foodName];
      if (!fid) continue;
      const fd = FOODS_FIXED.find((f) => f.foodName === foodName)!;
      if (!fd) continue;
      // Each popular food gets 200–500 items spread over past 90 days
      const totalItems = 200 + Math.floor(Math.random() * 300);
      for (let i = 0; i < totalItems; i++) {
        const uid = popUserIds[i % popUserIds.length];
        const dayOff = 1 + Math.floor(Math.random() * 90);
        const mt = ['MEAL_BREAKFAST', 'MEAL_LUNCH', 'MEAL_DINNER'][
          Math.floor(Math.random() * 3)
        ];
        await createMealWithItems(prisma, uid, daysAgo(dayOff), mt, [
          {
            foodId: fid,
            qty: 1,
            cal: fd.cal,
            pro: fd.pro,
            carb: fd.carb,
            fat: fd.fat,
            fib: fd.fib,
          },
        ]);
      }
    }

    console.log('Phase 8 done');

    console.log(
      '\nAll phases complete! Controlled seed data ready for testing.',
    );
  } catch (err) {
    console.error('Controlled seed failed:', err);
    throw err;
  } finally {
    await app.close();
  }
}

void runControlledSeed();
