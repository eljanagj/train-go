import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateRouteDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsNotEmpty()
  @IsNumber()
  readonly capacity: number;

  @IsNotEmpty()
  @IsNumber()
  readonly trainId: number;

  @IsNotEmpty()
  @IsString()
  readonly departureStation: string;

  @IsNotEmpty()
  @IsString()
  readonly arrivalStation: string;

  @IsNotEmpty()
  @IsNumber()
  readonly price: number;
}
