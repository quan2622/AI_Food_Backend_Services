import { IsBoolean } from 'class-validator';

export class UpdateStatusDto {
  @IsBoolean({ message: 'Status phải là true hoặc false' })
  status: boolean;
}
