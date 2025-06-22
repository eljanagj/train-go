import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TermsCondition } from './entities/terms-condition.entity';
import { CreateTermsConditionDto } from './dto/create-terms-condition.dto';
import { UpdateTermsConditionDto } from './dto/update-terms-condition.dto';

@Injectable()
export class TermsConditionService {
  constructor(
    @InjectRepository(TermsCondition)
    private termsRepo: Repository<TermsCondition>,
  ) {}

  async create(dto: CreateTermsConditionDto): Promise<TermsCondition> {
    const term = this.termsRepo.create(dto);
    return this.termsRepo.save(term);
  }

  async findAll(): Promise<TermsCondition[]> {
    return this.termsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<TermsCondition> {
    const term = await this.termsRepo.findOne({ where: { id } });
    if (!term) throw new NotFoundException(`Terms and Conditions with ID ${id} not found`);
    return term;
  }

  async update(id: string, dto: UpdateTermsConditionDto): Promise<TermsCondition> {
    const term = await this.findOne(id);
    Object.assign(term, dto);
    return this.termsRepo.save(term);
  }

  async remove(id: string): Promise<void> {
    const term = await this.findOne(id);
    await this.termsRepo.remove(term);
  }
} 