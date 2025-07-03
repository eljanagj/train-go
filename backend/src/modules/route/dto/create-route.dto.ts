import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class CreateRouteDto {
  @IsNotEmpty()
  @IsString()
  readonly departureStation: string;

  @IsNotEmpty()
  @IsString()
  readonly arrivalStation: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  readonly price: number;

  @IsNotEmpty()
  @IsNumber()
  readonly trainID: number;
}
