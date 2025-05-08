import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateTrainDto {
  @IsString()
  trainName: string;

  @IsNotEmpty()
  model: string;

  @IsNumber()
  capacity: number;

  // Optional additional fields
  @IsString()
  manufacturer?: string;

  @IsNumber()
  productionYear?: number;
}
