import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class ApplyDiscountDto {
  @IsNotEmpty()
  @IsString()
  discountCode: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  originalPrice: number;
}

export class DiscountApplicationResult {
  isValid: boolean;
  discountedPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  message?: string;
} 