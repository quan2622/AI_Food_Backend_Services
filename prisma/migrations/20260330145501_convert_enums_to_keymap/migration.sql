/*
  Migration: Convert enum types to string keyMap from AllCode
  
  This migration changes enum columns to TEXT to store AllCode keyMap values.
  The conversion uses CAST to preserve existing data.
*/

-- 2. Convert daily_logs.status
ALTER TABLE "daily_logs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "daily_logs" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
ALTER TABLE "daily_logs" ALTER COLUMN "status" SET DEFAULT 'STATUS_BELOW';

-- 3. Convert food_nutrition_profiles.source
ALTER TABLE "food_nutrition_profiles" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "food_nutrition_profiles" ALTER COLUMN "source" TYPE TEXT USING "source"::TEXT;
ALTER TABLE "food_nutrition_profiles" ALTER COLUMN "source" SET DEFAULT 'SRC_MANUAL';

-- 4. Convert ingredient_nutritions.servingUnit and source
ALTER TABLE "ingredient_nutritions" ALTER COLUMN "servingUnit" DROP DEFAULT;
ALTER TABLE "ingredient_nutritions" ALTER COLUMN "servingUnit" TYPE TEXT USING "servingUnit"::TEXT;
ALTER TABLE "ingredient_nutritions" ALTER COLUMN "servingUnit" SET DEFAULT 'UNIT_G';

ALTER TABLE "ingredient_nutritions" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "ingredient_nutritions" ALTER COLUMN "source" TYPE TEXT USING "source"::TEXT;
ALTER TABLE "ingredient_nutritions" ALTER COLUMN "source" SET DEFAULT 'SRC_MANUAL';

-- 5. Convert meals.mealType
ALTER TABLE "meals" ALTER COLUMN "mealType" TYPE TEXT USING "mealType"::TEXT;

-- 6. Convert nutrients.unit
ALTER TABLE "nutrients" ALTER COLUMN "unit" TYPE TEXT USING "unit"::TEXT;

-- 7. Convert nutrition_goals.goalType
ALTER TABLE "nutrition_goals" ALTER COLUMN "goalType" TYPE TEXT USING "goalType"::TEXT;

-- 8. Convert reports.reportType
ALTER TABLE "reports" ALTER COLUMN "reportType" TYPE TEXT USING "reportType"::TEXT;

-- 9. Convert user_allergies.severity
ALTER TABLE "user_allergies" ALTER COLUMN "severity" TYPE TEXT USING "severity"::TEXT;

-- 10. Convert user_profiles.activityLevel
ALTER TABLE "user_profiles" ALTER COLUMN "activityLevel" DROP DEFAULT;
ALTER TABLE "user_profiles" ALTER COLUMN "activityLevel" TYPE TEXT USING "activityLevel"::TEXT;
