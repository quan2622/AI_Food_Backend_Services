import { IsEnum, IsNotEmpty } from 'class-validator';

export enum TrendType {
  WEEK = 'week',
  MONTH = 'month',
}

export enum NutritionMetric {
  CALORIES = 'calories',
  PROTEIN = 'protein',
  CARBS = 'carbs',
  FAT = 'fat',
  FIBER = 'fiber',
}

export class NutritionMetricTrendDto {
  @IsEnum(TrendType, { message: 'Type phải là week hoặc month' })
  @IsNotEmpty()
  type: TrendType;

  @IsEnum(NutritionMetric, { message: 'Metric phải là calories, protein, carbs, fat hoặc fiber' })
  @IsNotEmpty()
  metric: NutritionMetric;
}
