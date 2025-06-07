import { IsNotEmpty, IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReviewRating } from '../entities/review.entity';

export class CreateReviewDto {
  @ApiProperty({ description: 'Rating from 1 to 5 stars', enum: ReviewRating })
  @IsNotEmpty()
  @IsEnum(ReviewRating)
  rating: ReviewRating;

  @ApiProperty({ description: 'Review comment' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  comment: string;

  @ApiProperty({ description: 'Review title (optional)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
} 