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
    const params: Record<string, string | number | undefined> = {
      user_id: query.user_id,
      meal_type: query.meal_type,
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
    try {
      const response = await firstValueFrom(
        this.httpService.post<RecommendationsResponse>(
          `${this.baseUrl}/v1/recommendations/query`,
          body,
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
