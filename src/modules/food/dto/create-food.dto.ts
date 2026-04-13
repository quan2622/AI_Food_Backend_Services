import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  IsNumber,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFoodIngredientInputDto } from './create-food-with-ingredients.dto.js';

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
  @IsInt({ message: 'categoryId phải là số nguyên' })
  @Min(1, { message: 'categoryId phải lớn hơn 0' })
  categoryId?: number;

  /** Khẩu phần mặc định (gram) cho 1 phần ăn — khớp `Food.defaultServingGrams` trong schema */
  @IsNumber({}, { message: 'defaultServingGrams phải là số' })
  @Min(0, { message: 'defaultServingGrams không được âm' })
  defaultServingGrams: number;

  /** Optional: cho phép tạo món kèm thành phần ngay trong 1 request */
  @IsOptional()
  @IsArray({ message: 'ingredients phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => CreateFoodIngredientInputDto)
  ingredients?: CreateFoodIngredientInputDto[];
}
