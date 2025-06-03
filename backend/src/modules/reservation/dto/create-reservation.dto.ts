import { IsNotEmpty, IsString, IsNumber, IsDate, IsOptional, IsArray, IsDateString } from 'class-validator';
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

  @ApiProperty({ description: 'The seat numbers' })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  seatNumbers: string[];

  @ApiProperty({ description: 'Passenger first name' })
  @IsNotEmpty()
  @IsString()
  passengerName: string;

  @ApiProperty({ description: 'Passenger last name' })
  @IsNotEmpty()
  @IsString()
  passengerSurname: string;

  @ApiProperty({ description: 'The reservation date' })
  @IsNotEmpty()
  @IsDateString()
  reservationDate: Date;

  @ApiProperty({ description: 'The discount code (optional)' })
  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}