import { PartialType } from '@nestjs/mapped-types';
import { CreateDiscountCodeDto } from './create-discount-code.dto';
import { IsOptional, IsNumber, IsDate, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDiscountCodeDto extends PartialType(CreateDiscountCodeDto) {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  discountPercentage?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expireDate?: Date;
} 