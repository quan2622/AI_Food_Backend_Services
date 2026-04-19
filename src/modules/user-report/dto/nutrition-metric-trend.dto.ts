import { IsEnum, IsNotEmpty } from 'class-validator';

export enum TrendType {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export enum NutritionMetric {
  CALORIES = 'calories',
  PROTEIN = 'protein',
  CARBS = 'carbs',
  FAT = 'fat',
  FIBER = 'fiber',
}

export class NutritionMetricTrendDto {
  @IsEnum(TrendType, { message: 'Type phải là day, week, month hoặc year' })
  @IsNotEmpty()
  type: TrendType;

  @IsEnum(NutritionMetric, { message: 'Metric phải là calories, protein, carbs, fat hoặc fiber' })
  @IsNotEmpty()
  metric: NutritionMetric;
}
