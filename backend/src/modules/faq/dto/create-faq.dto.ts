import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 