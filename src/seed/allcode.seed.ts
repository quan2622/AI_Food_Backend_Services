import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AllcodeService } from '../modules/allcode/allcode.service';
import type { CreateAllcodeDto } from '../modules/allcode/dto/create-allcode.dto';

const allCodes: CreateAllcodeDto[] = [
  // --- GOAL ---
  {
    keyMap: 'GOAL_LOSS',
    type: 'GOAL',
    value: 'WEIGHT_LOSS',
    description: 'Giảm cân',
  },
  {
    keyMap: 'GOAL_GAIN',
    type: 'GOAL',
    value: 'WEIGHT_GAIN',
    description: 'Tăng cân',
  },
  {
    keyMap: 'GOAL_MAINTAIN',
    type: 'GOAL',
    value: 'MAINTENANCE',
    description: 'Duy trì cân nặng',
  },
  {
    keyMap: 'GOAL_STRICT',
    type: 'GOAL',
    value: 'STRICT_DIET',
    description: 'Chế độ ăn nghiêm ngặt',
  },

  // --- MEAL ---
  {
    keyMap: 'MEAL_BREAKFAST',
    type: 'MEAL',
    value: 'BREAKFAST',
    description: 'Bữa sáng',
  },
  {
    keyMap: 'MEAL_LUNCH',
    type: 'MEAL',
    value: 'LUNCH',
    description: 'Bữa trưa',
  },
  {
    keyMap: 'MEAL_DINNER',
    type: 'MEAL',
    value: 'DINNER',
    description: 'Bữa tối',
  },
  {
    keyMap: 'MEAL_SNACK',
    type: 'MEAL',
    value: 'SNACK',
    description: 'Bữa phụ',
  },

  // --- STATUS ---
  {
    keyMap: 'STATUS_BELOW',
    type: 'STATUS',
    value: 'BELOW',
    description: 'Dưới mức mục tiêu',
  },
  {
    keyMap: 'STATUS_MET',
    type: 'STATUS',
    value: 'MET',
    description: 'Đã đạt mục tiêu',
  },
  {
    keyMap: 'STATUS_ABOVE',
    type: 'STATUS',
    value: 'ABOVE',
    description: 'Vượt mức mục tiêu',
  },

  // --- SEVERITY ---
  {
    keyMap: 'SEV_LOW',
    type: 'SEVERITY',
    value: 'LOW',
    description: 'Mức độ thấp',
  },
  {
    keyMap: 'SEV_MEDIUM',
    type: 'SEVERITY',
    value: 'MEDIUM',
    description: 'Mức độ trung bình',
  },
  {
    keyMap: 'SEV_HIGH',
    type: 'SEVERITY',
    value: 'HIGH',
    description: 'Mức độ cao',
  },
  {
    keyMap: 'SEV_LIFE_THREATENING',
    type: 'SEVERITY',
    value: 'LIFE_THREATENING',
    description: 'Nguy hiểm tính mạng',
  },

  // --- ACTIVITY ---
  {
    keyMap: 'ACT_SEDENTARY',
    type: 'ACTIVITY',
    value: 'SEDENTARY',
    description: 'Ít vận động',
  },
  {
    keyMap: 'ACT_LIGHT',
    type: 'ACTIVITY',
    value: 'LIGHTLY_ACTIVE',
    description: 'Vận động nhẹ',
  },
  {
    keyMap: 'ACT_MODERATE',
    type: 'ACTIVITY',
    value: 'MODERATELY_ACTIVE',
    description: 'Vận động vừa',
  },
  {
    keyMap: 'ACT_VERY',
    type: 'ACTIVITY',
    value: 'VERY_ACTIVE',
    description: 'Vận động mạnh',
  },
  {
    keyMap: 'ACT_SUPER',
    type: 'ACTIVITY',
    value: 'SUPER_ACTIVE',
    description: 'Vận động rất mạnh',
  },

  // --- REPORT ---
  {
    keyMap: 'REP_UPLOAD',
    type: 'REPORT',
    value: 'UPLOAD_COUNT',
    description: 'Thống kê lượt tải lên',
  },
  {
    keyMap: 'REP_POPULAR',
    type: 'REPORT',
    value: 'POPULAR_FOOD',
    description: 'Thống kê thực phẩm phổ biến',
  },
  {
    keyMap: 'REP_TRAFFIC',
    type: 'REPORT',
    value: 'TRAFFIC',
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
    value: 'MANUAL',
    description: 'Nhập thủ công bởi người dùng',
  },
  {
    keyMap: 'SRC_CALC',
    type: 'SOURCE',
    value: 'CALCULATED',
    description: 'Dữ liệu được hệ thống tự tính toán',
  },

  // --- UNIT ---
  {
    keyMap: 'UNIT_G',
    type: 'UNIT',
    value: 'UNIT_G',
    description: 'Gram',
  },
  {
    keyMap: 'UNIT_KG',
    type: 'UNIT',
    value: 'UNIT_KG',
    description: 'Kilogram',
  },
  {
    keyMap: 'UNIT_MG',
    type: 'UNIT',
    value: 'UNIT_MG',
    description: 'Milligram',
  },
  {
    keyMap: 'UNIT_OZ',
    type: 'UNIT',
    value: 'UNIT_OZ',
    description: 'Ounce',
  },
  {
    keyMap: 'UNIT_LB',
    type: 'UNIT',
    value: 'UNIT_LB',
    description: 'Pound',
  },

  // --- NUTR_GOAL ---
  {
    keyMap: 'NUTR_GOAL_ONGOING',
    type: 'NUTR_GOAL',
    value: 'ONGOING',
    description: 'Đang tiến hành',
  },
  {
    keyMap: 'NUTR_GOAL_COMPLETED',
    type: 'NUTR_GOAL',
    value: 'COMPLETED',
    description: 'Hoàn thành',
  },
  {
    keyMap: 'NUTR_GOAL_PAUSED',
    type: 'NUTR_GOAL',
    value: 'PAUSED',
    description: 'Tạm dừng',
  },
  {
    keyMap: 'NUTR_GOAL_FAILED',
    type: 'NUTR_GOAL',
    value: 'FAILED',
    description: 'Thất bại',
  },

  // --- GENDER ---
  {
    keyMap: 'MALE',
    type: 'GENDER',
    value: 'MALE',
    description: 'Nam',
  },
  {
    keyMap: 'FEMALE',
    type: 'GENDER',
    value: 'FEMALE',
    description: 'Nữ',
  },
  {
    keyMap: 'UNDEFINED',
    type: 'GENDER',
    value: 'UNDEFINED',
    description: 'Chưa xác định',
  },
];

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const allcodeService = app.get(AllcodeService);

    // Xóa data cũ trước khi seed
    await allcodeService.removeAll();
    console.log('Cleared existing all_codes data');

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
