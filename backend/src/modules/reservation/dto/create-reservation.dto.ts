import { IsNotEmpty, IsString, IsNumber, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  // @ApiProperty({ description: 'The ticket ID' })
  // @IsNotEmpty()
  // @IsString()
  // ticketId: string;

  @ApiProperty({ description: 'The schedule ID' })
  @IsNotEmpty()
  @IsNumber()
  scheduleId: number;

  // @ApiProperty({ description: 'The seat ID' })
  // @IsNotEmpty()
  // @IsNumber()
  // seatId: number;

  @ApiProperty({ description: 'The seat number' })
  @IsNotEmpty()
  @IsString()
  seatNumber: string;

  @ApiProperty({ description: 'Passenger first name' })
  @IsOptional()
  @IsString()
  passengerName?: string;

  @ApiProperty({ description: 'Passenger last name' })
  @IsOptional()
  @IsString()
  passengerSurname?: string;

  @ApiProperty({ description: 'The reservation date' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  reservationDate: Date;

  @ApiProperty({ description: 'The discount code (optional)' })
  @IsOptional()
  @IsString()
  discountCode?: string;
}