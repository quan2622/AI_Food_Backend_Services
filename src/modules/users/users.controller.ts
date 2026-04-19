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
  UseInterceptors,
  UploadedFile,
  MaxFileSizeValidator,
  ParseFilePipe,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdatePasswordDto } from './dto/update-password.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { User } from '@/common/decorators';
import type { UserAuthPayload } from '@/types/index.type';
import { AdminGuard } from '../../guards/admin.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get('/admin')
  findAllAdmin(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.usersService.findAllAdmin(page, limit, qs);
  }

  @Get('me')
  getCurrentUser(
    @User()
    user: UserAuthPayload,
  ) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @UseInterceptors(
    FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  updateMe(
    @User() user: UserAuthPayload,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
            message: 'Ảnh không được vượt quá 5MB',
          }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    avatar?: Express.Multer.File,
  ) {
    return this.usersService.updateMe(user.id, updateUserDto, avatar);
  }

  @UseGuards(AdminGuard)
  @Get('/admin/:id')
  findOneAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneAdmin(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/password')
  updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(id, updatePasswordDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.usersService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
