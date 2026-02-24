import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  Min,
  MaxLength,
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

  @IsString()
  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  @MaxLength(100)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

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
}
