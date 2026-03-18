import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  Min, 
  IsDateString 
} from 'class-validator';

export class CreateWorkoutLogDto {
  @IsNotEmpty()
  @IsString()
  workoutType: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMinute?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  burnedCalories?: number;

  @IsNotEmpty()
  @IsDateString()
  startedAt: string;

  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
