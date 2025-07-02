import { IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateRouteDto {
  @IsOptional()
  @IsNumber()
  readonly departureStationId?: number;

  @IsOptional()
  @IsNumber()
  readonly arrivalStationId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly price?: number;

  @IsOptional()
  @IsNumber()
  readonly trainID?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly capacity?: number;
}
