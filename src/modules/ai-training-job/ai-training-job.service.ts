import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import { AITrainingJobStatus } from '../../generated/prisma/enums';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTrainingJobDto,
  UpdateJobStatusDto,
  QueryTrainingJobDto,
  ApplyModelDto,
} from './dto';

@Injectable()
export class AiTrainingJobService {
  private readonly logger = new Logger(AiTrainingJobService.name);
  private readonly coreServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.coreServiceUrl =
      this.configService.get<string>('AI_CORE_SERVICE_URL') ??
      'http://localhost:8000';
  }

  // ─── Create training job ────────────────────────────────────────────────────

  async create(adminId: number, dto: CreateTrainingJobDto) {
    // Block nếu đã có job đang chạy với cùng modelName
    const running = await this.prisma.aITrainingJob.findFirst({
      where: {
        modelName: dto.modelName,
        status: {
          in: [
            AITrainingJobStatus.TRAIN_PENDING,
            AITrainingJobStatus.TRAIN_PREPARING,
            AITrainingJobStatus.TRAIN_RUNNING,
          ],
        },
      },
    });

    if (running) {
      throw new BadRequestException(
        `Đã có job đang chạy cho model "${dto.modelName}" (job #${running.id}). Hãy hủy hoặc chờ nó hoàn thành.`,
      );
    }

    const job = await this.prisma.aITrainingJob.create({
      data: {
        modelName: dto.modelName,
        datasetZipUrl: dto.datasetZipUrl ?? null,
        triggeredById: adminId,
        status: AITrainingJobStatus.TRAIN_PENDING,
      },
      include: { triggeredBy: { select: { id: true, fullName: true, email: true } } },
    });

    // Gọi sang core service để bắt đầu training (fire-and-forget, không block response)
    this.dispatchToCoreService(job.id, dto).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to dispatch job #${job.id} to core service: ${msg}`);
    });

    return job;
  }

  // ─── List jobs (paginated) ──────────────────────────────────────────────────

  async findAll(query: QueryTrainingJobDto) {
    const current = query.current ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (current - 1) * pageSize;

    const where: Prisma.AITrainingJobWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.modelName) where.modelName = query.modelName;

    const [total, items] = await Promise.all([
      this.prisma.aITrainingJob.count({ where }),
      this.prisma.aITrainingJob.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          triggeredBy: { select: { id: true, fullName: true, email: true } },
          deployedModel: true,
        },
      }),
    ]);

    return {
      EC: 0,
      EM: 'Lấy danh sách training jobs thành công',
      meta: {
        current,
        pageSize,
        pages: Math.ceil(total / pageSize),
        total,
      },
      result: items,
    };
  }

  // ─── Get one job ────────────────────────────────────────────────────────────

  async findOne(id: number) {
    const job = await this.prisma.aITrainingJob.findUnique({
      where: { id },
      include: {
        triggeredBy: { select: { id: true, fullName: true, email: true } },
        deployedModel: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Không tìm thấy training job với id=${id}`);
    }

    return job;
  }

  // ─── Cancel job ─────────────────────────────────────────────────────────────

  async cancel(id: number, adminId: number) {
    const job = await this.findOne(id);

    if (job.triggeredById !== adminId) {
      throw new ForbiddenException('Bạn không có quyền hủy job này');
    }

    const cancellable: AITrainingJobStatus[] = [
      AITrainingJobStatus.TRAIN_PENDING,
      AITrainingJobStatus.TRAIN_PREPARING,
    ];

    if (!cancellable.includes(job.status)) {
      throw new BadRequestException(
        `Không thể hủy job ở trạng thái "${job.status}". Chỉ hủy được khi PENDING hoặc PREPARING.`,
      );
    }

    return this.prisma.aITrainingJob.update({
      where: { id },
      data: { status: AITrainingJobStatus.TRAIN_CANCELLED },
    });
  }

  // ─── Webhook: core service cập nhật tiến độ ─────────────────────────────────

  async updateStatus(id: number, dto: UpdateJobStatusDto) {
    const job = await this.findOne(id);

    const terminal: AITrainingJobStatus[] = [
      AITrainingJobStatus.TRAIN_DONE,
      AITrainingJobStatus.TRAIN_FAILED,
      AITrainingJobStatus.TRAIN_CANCELLED,
    ];

    if (terminal.includes(job.status)) {
      throw new BadRequestException(
        `Job #${id} đã ở trạng thái cuối "${job.status}", không thể cập nhật thêm.`,
      );
    }

    const data: Prisma.AITrainingJobUpdateInput = {};

    if (dto.status) data.status = dto.status;
    if (dto.logText !== undefined) data.logText = dto.logText;
    if (dto.errorMessage !== undefined) data.errorMessage = dto.errorMessage;
    if (dto.metrics !== undefined) data.metrics = dto.metrics as Prisma.InputJsonValue;
    if (dto.outputModelPath !== undefined) data.outputModelPath = dto.outputModelPath;
    if (dto.datasetPath !== undefined) data.datasetPath = dto.datasetPath;
    if (dto.numClasses !== undefined) data.numClasses = dto.numClasses;
    if (dto.classNames !== undefined) data.classNames = dto.classNames;
    if (dto.trainSize !== undefined) data.trainSize = dto.trainSize;
    if (dto.valSize !== undefined) data.valSize = dto.valSize;
    if (dto.testSize !== undefined) data.testSize = dto.testSize;
    if (dto.startedAt !== undefined) data.startedAt = new Date(dto.startedAt);
    if (dto.finishedAt !== undefined) data.finishedAt = new Date(dto.finishedAt);

    return this.prisma.aITrainingJob.update({ where: { id }, data });
  }

  // ─── Apply: deploy model từ job đã done ─────────────────────────────────────

  async applyModel(id: number, dto: ApplyModelDto) {
    const job = await this.findOne(id);

    if (job.status !== AITrainingJobStatus.TRAIN_DONE) {
      throw new BadRequestException(
        `Chỉ có thể deploy khi job ở trạng thái TRAIN_DONE. Hiện tại: "${job.status}"`,
      );
    }

    if (!job.outputModelPath) {
      throw new BadRequestException(
        `Job #${id} chưa có outputModelPath. Không thể deploy.`,
      );
    }

    // Nếu job đã được deploy trước đó → trả luôn model hiện tại
    if (job.deployedModel) {
      return { EC: 0, EM: 'Job đã được deploy trước đó', result: job.deployedModel };
    }

    // Lấy metrics từ job
    const metrics = (job.metrics ?? {}) as Record<string, unknown>;

    // Tắt active tất cả model cùng modelName đang active
    await this.prisma.aIModel.updateMany({
      where: { modelName: job.modelName, isActive: true },
      data: { isActive: false },
    });

    // Tạo AIModel mới và link về job này
    const model = await this.prisma.aIModel.create({
      data: {
        modelName: job.modelName,
        version: dto.version,
        accuracy: metrics['val_acc'] != null ? String(metrics['val_acc']) : null,
        valLoss: metrics['val_loss'] != null ? String(metrics['val_loss']) : null,
        bestEpoch: typeof metrics['best_epoch'] === 'number' ? metrics['best_epoch'] : null,
        numClasses: job.numClasses ?? 0,
        classNames: job.classNames,
        isActive: true,
        modelFilePath: job.outputModelPath,
        trainingJobId: job.id,
      },
    });

    this.logger.log(`Deployed model "${job.modelName}" v${dto.version} from job #${id}`);

    return { EC: 0, EM: 'Deploy model thành công', result: model };
  }

  // ─── Private: dispatch training request to core FastAPI ─────────────────────

  private async dispatchToCoreService(jobId: number, dto: CreateTrainingJobDto) {
    const url = `${this.coreServiceUrl}/train/jobs`;

    const payload = {
      job_id: jobId,
      model_name: dto.modelName,
      dataset_zip_url: dto.datasetZipUrl ?? null,
      callback_url: `${this.configService.get<string>('BACKEND_SERVICE_URL') ?? 'http://localhost:3000'}/ai-training-jobs/${jobId}/status`,
    };

    await firstValueFrom(
      this.httpService.post(url, payload).pipe(
        catchError((err: AxiosError) => {
          if (err.code === 'ECONNREFUSED') {
            throw new HttpException(
              'Core AI service không khả dụng. Training job đã được ghi nhận nhưng chưa được khởi động.',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }
          throw new HttpException(
            `Core service lỗi: ${String(err.response?.data ?? err.message)}`,
            err.response?.status ?? HttpStatus.BAD_GATEWAY,
          );
        }),
      ),
    );

    this.logger.log(`Dispatched job #${jobId} (${dto.modelName}) to core service`);
  }
}
