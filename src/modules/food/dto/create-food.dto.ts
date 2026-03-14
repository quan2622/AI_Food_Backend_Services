import { FoodType } from '../../../generated/prisma/client.js';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  Min,
  MaxLength,
  IsIn,
  IsInt,
} from 'class-validator';

export class CreateFoodDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên món ăn không được để trống' })
  @MaxLength(255)
  foodName: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Fiber không hợp lệ' })
  @Min(0)
  fiber?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Protein không hợp lệ' })
  @Min(0)
  protein?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Carbs không hợp lệ' })
  @Min(0)
  carbs?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Fat không hợp lệ' })
  @Min(0)
  fat?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Calories không hợp lệ' })
  @IsPositive({ message: 'Calories phải là số dương' })
  calories?: number;

  @IsOptional()
  @IsInt({ message: 'categoryId phải là số nguyên' })
  @Min(1, { message: 'categoryId phải lớn hơn 0' })
  categoryId?: number;

  @IsOptional()
  @IsIn(['INGREDIENT', 'DISH', 'BRANDED'], {
    message: 'foodType không hợp lệ',
  })
  foodType?: FoodType;
}
