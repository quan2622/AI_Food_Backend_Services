import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export enum ModelArchitecture {
  EFFICIENTNET_B3 = 'efficientnet_b3',
  RESNET50 = 'resnet50',
  INCEPTIONV3 = 'inceptionv3',
}

export class CreateTrainingJobDto {
  @IsEnum(ModelArchitecture, {
    message: 'modelName phải là efficientnet_b3, resnet50 hoặc inceptionv3',
  })
  @IsNotEmpty({ message: 'modelName không được để trống' })
  modelName: ModelArchitecture;

  @IsOptional()
  @IsUrl({}, { message: 'datasetZipUrl phải là URL hợp lệ' })
  datasetZipUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
