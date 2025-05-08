import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { TrainStatus } from '../entities/train-status.enum';

export class UpdateTrainDto {
  @IsOptional()
  @IsString()
  trainName?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsNumber()
  productionYear?: number;  

  @IsOptional()
  @IsEnum(TrainStatus)
  status?: TrainStatus;
}
