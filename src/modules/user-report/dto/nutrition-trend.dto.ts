import { IsEnum, IsNotEmpty } from 'class-validator';

export enum TrendOption {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class NutritionTrendDto {
  @IsEnum(TrendOption, { message: 'Option phải là day, week, month hoặc year' })
  @IsNotEmpty()
  option: TrendOption;
}
