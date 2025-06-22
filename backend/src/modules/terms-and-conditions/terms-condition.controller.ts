import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TermsConditionService } from './terms-condition.service';
import { CreateTermsConditionDto } from './dto/create-terms-condition.dto';
import { UpdateTermsConditionDto } from './dto/update-terms-condition.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('terms-conditions')
@Controller('terms-conditions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TermsConditionController {
  constructor(private readonly termsService: TermsConditionService) {}

  @Post()
  @Roles('Admin')
  @ApiOperation({ summary: 'Create new Terms and Conditions entry' })
  @ApiResponse({ status: 201, description: 'Entry created successfully' })
  create(@Body() dto: CreateTermsConditionDto) {
    return this.termsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Terms and Conditions' })
  findAll() {
    return this.termsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Terms and Conditions entry by ID' })
  findOne(@Param('id') id: string) {
    return this.termsService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update Terms and Conditions entry' })
  update(@Param('id') id: string, @Body() dto: UpdateTermsConditionDto) {
    return this.termsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete Terms and Conditions entry' })
  remove(@Param('id') id: string) {
    return this.termsService.remove(id);
  }
} 