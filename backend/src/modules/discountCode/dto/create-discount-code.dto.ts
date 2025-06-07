import { IsNotEmpty, IsNumber, IsDate, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDiscountCodeDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(30)
  discountPercentage: number;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  expireDate: Date;
} 