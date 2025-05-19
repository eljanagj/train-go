import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTrainDto {
  @ApiProperty({ description: 'The name of the train' })
  @IsNotEmpty()
  @IsString()
  trainName: string;

  @ApiProperty({ description: 'The model of the train' })
  @IsNotEmpty()
  @IsString()
  model: string;

  @ApiProperty({ description: 'The manufacturer of the train' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiProperty({ description: 'The production year of the train' })
  @IsOptional()
  @IsNumber()
  productionYear?: number;

  @ApiProperty({ description: 'Total capacity of the train', default: 0 })
  @IsOptional()
  @IsNumber()
  totalCapacity?: number = 0;

  @ApiProperty({ description: 'Number of available seats', default: 0 })
  @IsOptional()
  @IsNumber()
  availableSeats?: number = 0;
}
