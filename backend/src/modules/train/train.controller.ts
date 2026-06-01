import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TrainService } from './train.service';
import { CreateTrainDto } from './dto/create-train.dto';
import { UpdateTrainDto } from './dto/update-train.dto';
import { UpdateTrainStatusDto } from './dto/update-train-status.dto';

@ApiTags('trains')
@Controller('trains')
export class TrainController {
  constructor(private readonly trainService: TrainService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new train' })
  @ApiResponse({ status: 201, description: 'Train created successfully' })
  async create(@Body() createTrainDto: CreateTrainDto) {
    return await this.trainService.create(createTrainDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all trains' })
  @ApiResponse({ status: 200, description: 'Returns list of trains' })
  async findAll() {
    return await this.trainService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a train by ID' })
  @ApiResponse({ status: 200, description: 'Returns the train' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.trainService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a train' })
  @ApiResponse({ status: 200, description: 'Train updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTrainDto: UpdateTrainDto,
  ) {
    return await this.trainService.update(id, updateTrainDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a train' })
  @ApiResponse({ status: 200, description: 'Train deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.trainService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update train status' })
  @ApiResponse({ status: 200, description: 'Train status updated successfully' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTrainStatusDto,
  ) {
    return this.trainService.updateStatus(id, dto.status);
  }
}
