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
} from '@nestjs/common';
import { AllcodeService } from './allcode.service';
import { CreateAllcodeDto } from './dto/create-allcode.dto.js';
import { UpdateAllcodeDto } from './dto/update-allcode.dto.js';

@Controller('allcodes')
export class AllcodeController {
  constructor(private readonly allcodeService: AllcodeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAllcodeDto: CreateAllcodeDto) {
    return this.allcodeService.create(createAllcodeDto);
  }

  @Get()
  findAll(@Query('type') type?: string) {
    if (type) {
      return this.allcodeService.findByType(type);
    }
    return this.allcodeService.findAll();
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.allcodeService.remove(id);
  }
}
