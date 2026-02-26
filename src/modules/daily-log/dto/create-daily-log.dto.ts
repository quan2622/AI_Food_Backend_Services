import { IsDateString, IsNotEmpty } from 'class-validator';

// DailyLog được tạo tự động bởi backend, DTO này chỉ dùng cho internal/admin
export class CreateDailyLogDto {
  @IsDateString({}, { message: 'Ngày nhật ký không hợp lệ (YYYY-MM-DD)' })
  @IsNotEmpty()
  logDate: string; // ISO date string: "YYYY-MM-DD"
}
