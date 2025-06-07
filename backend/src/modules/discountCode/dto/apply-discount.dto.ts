import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class ApplyDiscountDto {
  @IsNotEmpty()
  @IsString()
  discountCode: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class DiscountApplicationResult {
  isValid: boolean;
  discountedPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  message?: string;
} 