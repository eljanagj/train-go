import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTermsConditionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;
} 