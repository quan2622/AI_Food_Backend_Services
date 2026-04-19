import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import FormData = require('form-data');
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import type { FoodImage } from '../../generated/prisma/client';

export interface PredictionItem {
  rank: number;
  class_name: string;
  name?: string | null;
  confidence: number;
}

export interface PredictionResult {
  image_id: string;
  filename: string;
  stored_path: string;
  top1: PredictionItem;
  predictions: PredictionItem[];
  savedImage?: FoodImage;
  matchedFood?: Record<string, unknown> | null;
}

@Injectable()
export class FoodRecognitionService {
  private readonly logger = new Logger(FoodRecognitionService.name);
  private readonly coreServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    this.coreServiceUrl =
      this.configService.get<string>('AI_CORE_SERVICE_URL') ??
      'http://localhost:8000';
  }

  async predict(
    file: Express.Multer.File,
    userId: number,
    modelName?: string,
    mealId?: number,
  ): Promise<PredictionResult> {
    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const params = modelName ? { model_name: modelName } : {};

    const [predictionResult, { url: imageUrl }] = await Promise.all([
      firstValueFrom(
        this.httpService
          .post<PredictionResult>(`${this.coreServiceUrl}/predict`, form, {
            headers: form.getHeaders(),
            params,
          })
          .pipe(
            catchError((err: AxiosError) => {
              this.logger.error(
                'AI core service error:',
                err.response?.data ?? err.message,
              );
              throw new BadGatewayException(
                (err.response?.data as { detail?: string })?.detail ??
                  'Không thể kết nối tới AI core service',
              );
            }),
          ),
      ).then((r) => r.data),
      this.cloudinaryService.uploadFile(file),
    ]);

    const predictionClassKeys = predictionResult.predictions.map((p) => p.class_name);
    const [savedImage, matchedFood, foodNames] = await Promise.all([
      this.prisma.foodImage.create({
        data: {
          userId,
          mealId: mealId ?? null,
          imageUrl,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
        },
      }),
      this.prisma.food.findUnique({
        where: { classKey: predictionResult.top1.class_name },
        include: {
          foodCategory: true,
          nutritionProfile: {
            include: { values: { include: { nutrient: true } } },
          },
          foodIngredients: {
            include: {
              ingredient: {
                include: {
                  ingredientAllergens: {
                    include: { allergen: true },
                  },
                },
              },
            },
            orderBy: { id: 'asc' },
          },
        },
      }),
      this.prisma.food.findMany({
        where: { classKey: { in: predictionClassKeys } },
        select: { classKey: true, foodName: true },
      }),
    ]);

    const nameMap = new Map(foodNames.map((f) => [f.classKey, f.foodName]));
    const enrichedPredictions = predictionResult.predictions.map((p) => ({
      ...p,
      name: nameMap.get(p.class_name) ?? null,
    }));

    return { ...predictionResult, predictions: enrichedPredictions, savedImage, matchedFood };
  }

  async getClasses(): Promise<{ classes: string[] }> {
    const { data } = await firstValueFrom(
      this.httpService
        .get<{ classes: string[] }>(`${this.coreServiceUrl}/classes`)
        .pipe(
          catchError((err: AxiosError) => {
            this.logger.error('AI core service error:', err.message);
            throw new BadGatewayException(
              'Không thể kết nối tới AI core service',
            );
          }),
        ),
    );

    return data;
  }

  async health(): Promise<Record<string, unknown>> {
    const { data } = await firstValueFrom(
      this.httpService
        .get<Record<string, unknown>>(`${this.coreServiceUrl}/health`)
        .pipe(
          catchError((err: AxiosError) => {
            this.logger.error('AI core service error:', err.message);
            throw new BadGatewayException(
              'Không thể kết nối tới AI core service',
            );
          }),
        ),
    );

    return data;
  }
}
