import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStationDto {
  @ApiProperty({ description: 'The name of the station' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'The location of the station' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Facilities available at the station' })
  @IsOptional()
  @IsString()
  facilities?: string;

  @ApiProperty({ description: 'Contact information for the station' })
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @ApiProperty({ description: 'Operating hours of the station' })
  @IsOptional()
  @IsString()
  operatingHours?: string;

  @ApiProperty({ description: 'Status of the station', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';
}
