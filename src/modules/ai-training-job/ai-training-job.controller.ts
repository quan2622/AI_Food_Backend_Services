import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AiTrainingJobService } from './ai-training-job.service';
import {
  CreateTrainingJobDto,
  UpdateJobStatusDto,
  QueryTrainingJobDto,
  ApplyModelDto,
} from './dto';
import { User } from 'src/common/decorators';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('ai-training-jobs')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AiTrainingJobController {
  constructor(private readonly aiTrainingJobService: AiTrainingJobService) {}

  // ─── Tạo job training mới ──────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @User() user: { id: number },
    @Body() dto: CreateTrainingJobDto,
  ) {
    const result = await this.aiTrainingJobService.create(user.id, dto);
    return {
      EC: 0,
      EM: 'Tạo training job thành công. Đang gửi yêu cầu tới core service...',
      result,
    };
  }

  // ─── Danh sách jobs (có phân trang, lọc theo status/modelName) ─────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: QueryTrainingJobDto) {
    return this.aiTrainingJobService.findAll(query);
  }

  // ─── Chi tiết một job ──────────────────────────────────────────────────────

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.aiTrainingJobService.findOne(id);
    return { EC: 0, EM: 'Lấy chi tiết training job thành công', result };
  }

  // ─── Hủy job (chỉ khi PENDING hoặc PREPARING) ─────────────────────────────

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @User() user: { id: number },
  ) {
    const result = await this.aiTrainingJobService.cancel(id, user.id);
    return { EC: 0, EM: 'Hủy training job thành công', result };
  }

  // ─── Webhook: core service callback cập nhật trạng thái / log ─────────────
  // Endpoint này KHÔNG cần AdminGuard vì được gọi từ core service
  // Trong production nên dùng shared secret header để xác thực

  @Patch(':id/status')
  @UseGuards()  // override: bỏ AdminGuard cho endpoint này
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobStatusDto,
  ) {
    const result = await this.aiTrainingJobService.updateStatus(id, dto);
    return { EC: 0, EM: 'Cập nhật trạng thái job thành công', result };
  }

  // ─── Deploy model từ job đã DONE ──────────────────────────────────────────

  @Post(':id/apply')
  @HttpCode(HttpStatus.OK)
  async applyModel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApplyModelDto,
  ) {
    return this.aiTrainingJobService.applyModel(id, dto);
  }
}
