import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import {
  GetRecommendationsQueryDto,
  QueryRecommendationsBodyDto,
  FeedbackBodyDto,
  RecommendationsResponse,
  HealthResponse,
} from './recommend.dto';

@Injectable()
export class RecommendService {
  private readonly baseUrl: string;
  private readonly logger = new Logger(RecommendService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('RECOMMENDATION_SERVICE_URL') ||
      'http://localhost:8081';
  }

  /**
   * Tự động xác định bữa ăn dựa theo khung giờ Việt Nam (UTC+7):
   * - Sáng    (BREAKFAST): 06:30 – 08:30
   * - Trưa   (LUNCH):     11:30 – 13:00
   * - Tối    (DINNER):    18:00 – 19:30
   * - Bữa phụ (SNACK):   Ngoài các khung giờ trên
   */
  private detectMealType(isoTime?: string): 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' {
    const base = isoTime ? new Date(isoTime) : new Date();
    // Chuyển sang giờ Việt Nam (UTC+7)
    const vnTime = new Date(base.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const totalMinutes = vnTime.getHours() * 60 + vnTime.getMinutes();

    // 06:30 – 08:30
    if (totalMinutes >= 390 && totalMinutes < 510) return 'BREAKFAST';
    // 11:30 – 13:00
    if (totalMinutes >= 690 && totalMinutes < 780) return 'LUNCH';
    // 18:00 – 19:30
    if (totalMinutes >= 1080 && totalMinutes < 1170) return 'DINNER';

    return 'SNACK';
  }

  private handleAxiosError(error: AxiosError, context: string): never {
    if (error.code === 'ECONNREFUSED') {
      this.logger.error(
        `Recommendation service is not available at ${this.baseUrl}`,
      );
      throw new HttpException(
        {
          status: 'error',
          message:
            'Recommendation service is not available. Please ensure the Python FastAPI service is running.',
          details: `Connection refused to ${this.baseUrl}`,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (error.response) {
      this.logger.error(
        `${context} failed: ${error.response.status} ${JSON.stringify(error.response.data)}`,
      );
      throw new HttpException(
        {
          status: 'error',
          message: `${context} failed`,
          details: error.response.data,
        },
        error.response.status || HttpStatus.BAD_GATEWAY,
      );
    }

    this.logger.error(`${context} error: ${error.message}`);
    throw new HttpException(
      {
        status: 'error',
        message: `${context} failed`,
        details: error.message,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }

  async healthCheck(): Promise<
    HealthResponse | { status: string; message: string }
  > {
    try {
      const response = await firstValueFrom(
        this.httpService.get<HealthResponse>(`${this.baseUrl}/health`).pipe(
          catchError((error: AxiosError) => {
            throw error;
          }),
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.warn('Health check failed');
      return {
        status: 'unavailable',
        message: `Recommendation service is not available at ${this.baseUrl}`,
      };
    }
  }

  async getRecommendations(
    query: GetRecommendationsQueryDto,
  ): Promise<RecommendationsResponse> {
    const resolvedMealType = query.meal_type ?? this.detectMealType(query.current_time);
    this.logger.log(
      `meal_type: ${query.meal_type ? `'${query.meal_type}' (from client)` : `'${resolvedMealType}' (auto-detected)`}`,
    );

    const params: Record<string, string | number | undefined> = {
      user_id: query.user_id,
      meal_type: resolvedMealType,
    };

    if (query.current_time) params.current_time = query.current_time;
    if (query.limit !== undefined) params.limit = query.limit;
    if (query.exclude_food_ids)
      params.exclude_food_ids = query.exclude_food_ids;
    if (query.meal_affinity_threshold !== undefined) {
      params.meal_affinity_threshold = query.meal_affinity_threshold;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<RecommendationsResponse>(
          `${this.baseUrl}/v1/recommendations`,
          { params },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleAxiosError(error as AxiosError, 'Get recommendations');
    }
  }

  async queryRecommendations(
    body: QueryRecommendationsBodyDto,
  ): Promise<RecommendationsResponse> {
    const resolvedMealType = body.meal_type ?? this.detectMealType(body.current_time);
    this.logger.log(
      `meal_type: ${body.meal_type ? `'${body.meal_type}' (from client)` : `'${resolvedMealType}' (auto-detected)`}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post<RecommendationsResponse>(
          `${this.baseUrl}/v1/recommendations/query`,
          { ...body, meal_type: resolvedMealType },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleAxiosError(error as AxiosError, 'Query recommendations');
    }
  }

  async submitFeedback(
    body: FeedbackBodyDto,
  ): Promise<{ status: string; message: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<{ status: string; message: string }>(
          `${this.baseUrl}/v1/feedback`,
          body,
        ),
      );
      return response.data;
    } catch (error) {
      this.handleAxiosError(error as AxiosError, 'Submit feedback');
    }
  }
}
