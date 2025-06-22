import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermsConditionService } from './terms-condition.service';
import { TermsConditionController } from './terms-condition.controller';
import { TermsCondition } from './entities/terms-condition.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([TermsCondition]), UserModule],
  controllers: [TermsConditionController],
  providers: [TermsConditionService],
  exports: [TermsConditionService],
})
export class TermsConditionModule {} 