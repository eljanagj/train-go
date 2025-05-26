import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateRouteDto {
  @IsOptional()
  @IsString()
  readonly departureStation?: string;

  @IsOptional()
  @IsString()
  readonly arrivalStation?: string;

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
