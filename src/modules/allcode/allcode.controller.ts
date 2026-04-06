import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../guards/admin.guard';
import { AllcodeService } from './allcode.service';
import { CreateAllcodeDto } from './dto/create-allcode.dto.js';
import { UpdateAllcodeDto } from './dto/update-allcode.dto.js';
import { BulkDeleteAllCodeDto } from './dto/bulk-delete-allcode.dto';
import { BulkCreateAllcodeDto } from './dto/bulk-create-allcode.dto.js';

@Controller('allcodes')
export class AllcodeController {
  constructor(private readonly allcodeService: AllcodeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAllcodeDto: CreateAllcodeDto) {
    return this.allcodeService.create(createAllcodeDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  createMany(@Body() dto: BulkCreateAllcodeDto) {
    return this.allcodeService.createMany(dto.items);
  }

  @Get()
  findAll(@Query('type') type?: string) {
    if (type) {
      return this.allcodeService.findByType(type);
    }
    return this.allcodeService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get('admin')
  findAllAdmin(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.allcodeService.findAllAdmin(page, limit, qs);
  }

  @Get('key/:keyMap')
  findByKeyMap(@Param('keyMap') keyMap: string) {
    return this.allcodeService.findByKeyMap(keyMap);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.allcodeService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAllcodeDto: UpdateAllcodeDto,
  ) {
    return this.allcodeService.update(id, updateAllcodeDto);
  }

  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: BulkDeleteAllCodeDto) {
    return this.allcodeService.removeMany(dto.ids);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.allcodeService.remove(id);
  }
}
