import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UserAllergyService } from './user-allergy.service';
import { CreateUserAllergyDto } from './dto/create-user-allergy.dto.js';
import { UpdateUserAllergyDto } from './dto/update-user-allergy.dto.js';
import { AdminGuard } from '../../guards/admin.guard';

@Controller('user-allergies')
export class UserAllergyController {
  constructor(private readonly userAllergyService: UserAllergyService) {}

  @Post()
  create(@Body() dto: CreateUserAllergyDto) {
    return this.userAllergyService.create(dto);
  }

  @Get('user/:userId')
  findAllByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.userAllergyService.findAllByUserId(userId);
  }

  @UseGuards(AdminGuard)
  @Get('/admin')
  findAllAdmin(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.userAllergyService.findAllAdmin(page, limit, qs);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userAllergyService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserAllergyDto,
  ) {
    return this.userAllergyService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userAllergyService.remove(id);
  }
}
