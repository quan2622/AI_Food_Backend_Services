import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserProfileModule } from './modules/user-profile/user-profile.module';
import { NutritionGoalModule } from './modules/nutrition-goal/nutrition-goal.module';
import { AllcodeModule } from './modules/allcode/allcode.module';
import { FoodModule } from './modules/food/food.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { MealModule } from './modules/meal/meal.module';
import { MealItemModule } from './modules/meal-item/meal-item.module';
import { FoodImageModule } from './modules/food-image/food-image.module';
import { DailyLogModule } from './modules/daily-log/daily-log.module';
import { UserAllergyModule } from './modules/user-allergy/user-allergy.module';
import { ReportModule } from './modules/report/report.module';
import { AiModelModule } from './modules/ai-model/ai-model.module';
import { AiTrainingJobModule } from './modules/ai-training-job/ai-training-job.module';
import { AllergenModule } from './modules/allergen/allergen.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    UserProfileModule,
    NutritionGoalModule,
    AllcodeModule,
    FoodModule,
    CloudinaryModule,
    MealModule,
    MealItemModule,
    FoodImageModule,
    DailyLogModule,
    UserAllergyModule,
    ReportModule,
    AiModelModule,
    AiTrainingJobModule,
    AllergenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
