import { IsEnum, IsNotEmpty } from 'class-validator';

export enum TrendOption {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class NutritionTrendDto {
  @IsEnum(TrendOption, { message: 'Option phải là day, week hoặc month' })
  @IsNotEmpty()
  option: TrendOption;
}
