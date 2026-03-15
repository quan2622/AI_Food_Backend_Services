import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { UserAllergyService } from './user-allergy.service';
import { CreateUserAllergyDto } from './dto/create-user-allergy.dto.js';
import { UpdateUserAllergyDto } from './dto/update-user-allergy.dto.js';

@Controller('user-allergies')
export class UserAllergyController {
  constructor(private readonly userAllergyService: UserAllergyService) {}

  @Post()
  create(@Body() dto: CreateUserAllergyDto) {
    return this.userAllergyService.create(dto);
  }

  @Get('profile/:profileId')
  findAll(@Param('profileId', ParseIntPipe) profileId: number) {
    return this.userAllergyService.findAllByUserProfile(profileId);
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
