import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AllcodeService } from '../modules/allcode/allcode.service';
import type { CreateAllcodeDto } from '../modules/allcode/dto/create-allcode.dto';

const allCodes: CreateAllcodeDto[] = [
  // --- GOAL ---
  {
    keyMap: 'GOAL_LOSS',
    type: 'GOAL',
    value: 'Weight Loss',
    description: 'Giảm cân (TDEE - 500)',
  },
  {
    keyMap: 'GOAL_GAIN',
    type: 'GOAL',
    value: 'Weight Gain',
    description: 'Tăng cân (TDEE + 500)',
  },
  {
    keyMap: 'GOAL_MAINTAIN',
    type: 'GOAL',
    value: 'Maintenance',
    description: 'Duy trì cân nặng (TDEE)',
  },

  // --- MEAL ---
  {
    keyMap: 'MEAL_BREAKFAST',
    type: 'MEAL',
    value: 'Breakfast',
    description: 'Bữa sáng',
  },
  {
    keyMap: 'MEAL_LUNCH',
    type: 'MEAL',
    value: 'Lunch',
    description: 'Bữa trưa',
  },
  {
    keyMap: 'MEAL_DINNER',
    type: 'MEAL',
    value: 'Dinner',
    description: 'Bữa tối',
  },
  {
    keyMap: 'MEAL_SNACK',
    type: 'MEAL',
    value: 'Snack',
    description: 'Bữa phụ',
  },

  // --- STATUS ---
  {
    keyMap: 'STATUS_BELOW',
    type: 'STATUS',
    value: 'Below',
    description: 'Dưới mức mục tiêu',
  },
  {
    keyMap: 'STATUS_MET',
    type: 'STATUS',
    value: 'Met',
    description: 'Đã đạt mục tiêu',
  },
  {
    keyMap: 'STATUS_ABOVE',
    type: 'STATUS',
    value: 'Above',
    description: 'Vượt mức mục tiêu',
  },

  // --- SEVERITY ---
  {
    keyMap: 'SEV_LOW',
    type: 'SEVERITY',
    value: 'Low',
    description: 'Mức độ thấp',
  },
  {
    keyMap: 'SEV_MEDIUM',
    type: 'SEVERITY',
    value: 'Medium',
    description: 'Mức độ trung bình',
  },
  {
    keyMap: 'SEV_HIGH',
    type: 'SEVERITY',
    value: 'High',
    description: 'Mức độ cao',
  },
  {
    keyMap: 'SEV_CRITICAL',
    type: 'SEVERITY',
    value: 'Life Threatening',
    description: 'Nguy hiểm tính mạng',
  },

  // --- ACTIVITY ---
  {
    keyMap: 'ACT_SEDENTARY',
    type: 'ACTIVITY',
    value: 'Sedentary',
    description: 'Ít vận động (BMR x 1.2)',
  },
  {
    keyMap: 'ACT_LIGHT',
    type: 'ACTIVITY',
    value: 'Lightly Active',
    description: 'Vận động nhẹ (BMR x 1.375)',
  },
  {
    keyMap: 'ACT_MODERATE',
    type: 'ACTIVITY',
    value: 'Moderately Active',
    description: 'Vận động vừa (BMR x 1.55)',
  },
  {
    keyMap: 'ACT_VERY',
    type: 'ACTIVITY',
    value: 'Very Active',
    description: 'Vận động mạnh (BMR x 1.725)',
  },
  {
    keyMap: 'ACT_SUPER',
    type: 'ACTIVITY',
    value: 'Super Active',
    description: 'Vận động rất mạnh (BMR x 1.9)',
  },

  // --- REPORT ---
  {
    keyMap: 'REP_UPLOAD',
    type: 'REPORT',
    value: 'Upload Count',
    description: 'Thống kê lượt tải lên',
  },
  {
    keyMap: 'REP_POPULAR',
    type: 'REPORT',
    value: 'Popular Food',
    description: 'Thống kê thực phẩm phổ biến',
  },
  {
    keyMap: 'REP_TRAFFIC',
    type: 'REPORT',
    value: 'Traffic',
    description: 'Thống kê lưu lượng truy cập',
  },

  // --- SOURCE ---
  {
    keyMap: 'SRC_USDA',
    type: 'SOURCE',
    value: 'USDA',
    description: 'Nguồn từ Bộ Nông nghiệp Hoa Kỳ',
  },
  {
    keyMap: 'SRC_MANUAL',
    type: 'SOURCE',
    value: 'Manual',
    description: 'Nhập thủ công bởi người dùng',
  },
  {
    keyMap: 'SRC_CALC',
    type: 'SOURCE',
    value: 'Calculated',
    description: 'Dữ liệu được hệ thống tự tính toán',
  },

  // --- UNIT ---
  {
    keyMap: 'UNIT_G',
    type: 'UNIT',
    value: 'g',
    description: 'Gram',
  },
  {
    keyMap: 'UNIT_KG',
    type: 'UNIT',
    value: 'kg',
    description: 'Kilogram',
  },
  {
    keyMap: 'UNIT_MG',
    type: 'UNIT',
    value: 'mg',
    description: 'Milligram',
  },
  {
    keyMap: 'UNIT_OZ',
    type: 'UNIT',
    value: 'oz',
    description: 'Ounce',
  },
  {
    keyMap: 'UNIT_LB',
    type: 'UNIT',
    value: 'lb',
    description: 'Pound',
  },
  {
    keyMap: 'UNIT_ML',
    type: 'UNIT',
    value: 'ml',
    description: 'Milliliter',
  },
];

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const allcodeService = app.get(AllcodeService);
    const result = await allcodeService.createMany(allCodes);

    console.log(`AllCode seed completed. Created: ${result.createdCount}`);
  } catch (error) {
    console.error('AllCode seed failed:', error);
    await app.close();
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

void bootstrap();
