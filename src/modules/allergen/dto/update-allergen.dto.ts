import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateAllergenDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  /**
   * Danh sách ingredient ID liên kết với allergen này.
   * Truyền vào sẽ REPLACE toàn bộ danh sách cũ (set-based sync).
   */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  ingredientIds?: number[];
}
