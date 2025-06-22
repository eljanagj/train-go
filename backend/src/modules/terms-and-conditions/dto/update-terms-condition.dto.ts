import { PartialType } from '@nestjs/mapped-types';
import { CreateTermsConditionDto } from './create-terms-condition.dto';

export class UpdateTermsConditionDto extends PartialType(CreateTermsConditionDto) {} 