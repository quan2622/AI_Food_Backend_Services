import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  ingredientName: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

