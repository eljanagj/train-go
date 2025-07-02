import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateRouteDto {
  @IsNotEmpty()
  @IsNumber()
  readonly departureStationId: number;

  @IsNotEmpty()
  @IsNumber()
  readonly arrivalStationId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  readonly price: number;

  @IsNotEmpty()
  @IsNumber()
  readonly trainID: number;
}
