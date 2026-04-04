import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto.js';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';
import { User } from 'src/common/decorators';
import type { UserAuthPayload } from '@/types/index.type';
import { AdminGuard } from '../../guards/admin.guard';

@Controller('user-profiles')
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @User() user: UserAuthPayload,
    @Body() createUserProfileDto: CreateUserProfileDto,
  ) {
    return this.userProfileService.create(user.id, createUserProfileDto);
  }

  @Get('all')
  findAll() {
    return this.userProfileService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get('/admin')
  findAllAdmin(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.userProfileService.findAllAdmin(page, limit, qs);
  }

  @Get()
  getMyProfile(@User() user: UserAuthPayload) {
    return this.userProfileService.findByUserId(user.id);
  }

  @Get('by-user/:userId')
  findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.userProfileService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userProfileService.findOne(id);
  }

  @Patch()
  updateMyProfile(
    @User() user: UserAuthPayload,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.userProfileService.updateByUserId(
      user.id,
      updateUserProfileDto,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.userProfileService.update(id, updateUserProfileDto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMyProfile(@User() user: UserAuthPayload) {
    return this.userProfileService.removeByUserId(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userProfileService.remove(id);
  }
}
