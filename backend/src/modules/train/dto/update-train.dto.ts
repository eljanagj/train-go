import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateTrainDto {
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
}
