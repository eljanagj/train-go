import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('faqs')
@Controller('faqs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Post()
  @Roles('Admin')
  @ApiOperation({ summary: 'Create a new FAQ' })
  @ApiResponse({ status: 201, description: 'FAQ created successfully' })
  create(@Body() createFaqDto: CreateFaqDto) {
    return this.faqService.create(createFaqDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active FAQs' })
  @ApiResponse({ status: 200, description: 'Returns list of active FAQs' })
  findAll() {
    return this.faqService.findAll();
  }

  @Get('admin/all')
  @Roles('Admin')
  @ApiOperation({ summary: 'Get all FAQs for admin' })
  @ApiResponse({ status: 200, description: 'Returns list of all FAQs' })
  findAllForAdmin() {
    return this.faqService.findAllForAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a FAQ by ID' })
  @ApiResponse({ status: 200, description: 'Returns the FAQ' })
  findOne(@Param('id') id: string) {
    return this.faqService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update a FAQ' })
  @ApiResponse({ status: 200, description: 'FAQ updated successfully' })
  update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto) {
    return this.faqService.update(id, updateFaqDto);
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete a FAQ' })
  @ApiResponse({ status: 200, description: 'FAQ deleted successfully' })
  remove(@Param('id') id: string) {
    return this.faqService.remove(id);
  }
} 