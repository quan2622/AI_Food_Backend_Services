export class GetRecommendationsQueryDto {
  user_id?: string;
  meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  current_time?: string;
  limit?: number;
  exclude_food_ids?: string;
  meal_affinity_threshold?: number;
}

export class QueryRecommendationsBodyDto {
  user_id?: string;
  meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  current_time?: string;
  limit?: number;
  exclude_food_ids?: number[];
  meal_affinity_threshold?: number;
}

export class FeedbackBodyDto {
  user_id: string;
  food_id: number;
  interaction_type: 'view' | 'click' | 'eat' | 'skip';
  meal_type?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  timestamp?: string;
}

export interface RecommendationItem {
  food_id: number;
  food_name: string;
  score: number;
  reason: string;
  portion_weight: number;
  portion_calories: number;
  nutrition_profile: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export interface RecommendationsResponse {
  user_id: string;
  meal_type: string;
  remaining_nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  recommendations: RecommendationItem[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}
