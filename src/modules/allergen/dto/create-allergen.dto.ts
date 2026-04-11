import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAllergenDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên allergen không được để trống' })
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  /** Danh sách ingredient ID sẽ được liên kết với allergen này */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  ingredientIds?: number[];
}
