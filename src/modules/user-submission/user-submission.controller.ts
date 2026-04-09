import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UserSubmissionService } from './user-submission.service';
import {
  CreateSubmissionDto,
  UpdateSubmissionStatusDto,
  QuerySubmissionDto,
  VoteSubmissionDto,
} from './dto';
import { User } from 'src/common/decorators';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('user-submissions')
@UseGuards(JwtAuthGuard)
export class UserSubmissionController {
  constructor(private readonly userSubmissionService: UserSubmissionService) {}

  // ─── User APIs ─────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @User() user: { id: number },
    @Body() dto: CreateSubmissionDto,
  ) {
    const result = await this.userSubmissionService.create(user.id, dto);
    return {
      EC: 0,
      EM: 'Tạo submission thành công',
      result,
    };
  }

  @Get('my-submissions')
  @HttpCode(HttpStatus.OK)
  async findMySubmissions(
    @User() user: { id: number },
    @Query() query: QuerySubmissionDto,
  ) {
    return this.userSubmissionService.findByUser(user.id, query);
  }

  @Delete('my-submissions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelSubmission(
    @User() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.userSubmissionService.cancelSubmission(user.id, id);
  }

  // ─── Community Voting APIs ──────────────────────────────────────────────────

  @Post(':id/vote')
  @HttpCode(HttpStatus.OK)
  async vote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VoteSubmissionDto,
  ) {
    const result = await this.userSubmissionService.vote(id, dto.voteType);
    return {
      EC: 0,
      EM: 'Vote thành công',
      result,
    };
  }

  // ─── Admin APIs ─────────────────────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QuerySubmissionDto) {
    return this.userSubmissionService.findAll(query);
  }

  @Get('admin/stats')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async getStats() {
    const result = await this.userSubmissionService.getStats();
    return {
      EC: 0,
      EM: 'Get stats success',
      result,
    };
  }

  @Get('admin/:id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.userSubmissionService.findOne(id);
    return {
      EC: 0,
      EM: 'Get submission detail success',
      result,
    };
  }

  @Patch('admin/:id/status')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubmissionStatusDto,
  ) {
    const result = await this.userSubmissionService.updateStatus(id, dto);
    return {
      EC: 0,
      EM: 'Cập nhật status thành công',
      result,
    };
  }

  @Post('admin/:id/approve')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body('adminNote') adminNote?: string,
  ) {
    const result = await this.userSubmissionService.approveAndProcess(
      id,
      adminNote,
    );
    return {
      EC: 0,
      EM: 'Duyệt và xử lý submission thành công',
      result,
    };
  }

  @Post('admin/:id/reject')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('adminNote') adminNote: string,
  ) {
    const result = await this.userSubmissionService.reject(id, adminNote);
    return {
      EC: 0,
      EM: 'Từ chối submission thành công',
      result,
    };
  }
}
