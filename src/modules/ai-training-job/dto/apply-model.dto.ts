import { IsNotEmpty, IsString } from 'class-validator';

export class ApplyModelDto {
  @IsString()
  @IsNotEmpty({ message: 'version không được để trống' })
  version: string;
}
