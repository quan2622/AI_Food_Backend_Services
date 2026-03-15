import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsInt,
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

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsInt({ message: 'categoryId phải là số nguyên' })
  @Min(1, { message: 'categoryId phải lớn hơn 0' })
  categoryId?: number;
}
