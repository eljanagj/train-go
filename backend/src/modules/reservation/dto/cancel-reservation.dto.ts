import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelReservationDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    required: false,
    example: 'Change of plans'
  })
  @IsString()
  @IsOptional()
  reason?: string;
} 