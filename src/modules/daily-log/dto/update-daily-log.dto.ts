import { IsNumber, IsOptional, IsString, IsIn } from 'class-validator';

// Dùng để admin chỉnh sửa thủ công nếu cần
export class UpdateDailyLogDto {
  @IsOptional()
  @IsNumber()
  totalCalories?: number;

  @IsOptional()
  @IsNumber()
  totalProtein?: number;

  @IsOptional()
  @IsNumber()
  totalCarbs?: number;

  @IsOptional()
  @IsNumber()
  totalFat?: number;

  @IsOptional()
  @IsNumber()
  targetCalories?: number;

  @IsOptional()
  @IsNumber()
  targetProtein?: number;

  @IsOptional()
  @IsNumber()
  targetCarbs?: number;

  @IsOptional()
  @IsString()
  @IsIn(['BELOW', 'MET', 'ABOVE'], {
    message: 'status phải là BELOW, MET hoặc ABOVE',
  })
  status?: string;
}
