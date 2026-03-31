import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecommendService } from './recommend.service';
import { User } from '../../common/decorators';
import {
  GetRecommendationsQueryDto,
  QueryRecommendationsBodyDto,
  FeedbackBodyDto,
} from './recommend.dto';

@Controller('recommend')
export class RecommendController {
  constructor(private readonly recommendService: RecommendService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    return this.recommendService.healthCheck();
  }

  @Get('recommendations')
  @HttpCode(HttpStatus.OK)
  getRecommendations(
    @User() user: { id: number },
    @Query() query: Omit<GetRecommendationsQueryDto, 'user_id'>,
  ) {
    const fullQuery = {
      ...query,
      user_id: user.id.toString(),
    } as GetRecommendationsQueryDto;
    return this.recommendService.getRecommendations(fullQuery);
  }

  @Post('recommendations/query')
  @HttpCode(HttpStatus.OK)
  queryRecommendations(
    @User() user: { id: number },
    @Body() body: Omit<QueryRecommendationsBodyDto, 'user_id'>,
  ) {
    const fullBody = {
      ...body,
      user_id: user.id.toString(),
    } as QueryRecommendationsBodyDto;
    return this.recommendService.queryRecommendations(fullBody);
  }

  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  submitFeedback(@Body() body: FeedbackBodyDto) {
    return this.recommendService.submitFeedback(body);
  }
}
