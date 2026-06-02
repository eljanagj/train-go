import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { TrainService } from './train.service';
import { CreateTrainDto } from './dto/create-train.dto';
import { UpdateTrainDto } from './dto/update-train.dto';
import { UpdateTrainStatusDto } from './dto/update-train-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('trains')
@Controller('trains')
export class TrainController {
  constructor(private readonly trainService: TrainService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Post()
  @ApiOperation({ summary: 'Create a new train' })
  @ApiResponse({ status: 201, description: 'Train created successfully' })
  async create(@Body() createTrainDto: CreateTrainDto) {
    return await this.trainService.create(createTrainDto);
  }

  @UseGuards(JwtAuthGuard)
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


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a train' })
  @ApiResponse({ status: 200, description: 'Train updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTrainDto: UpdateTrainDto,
  ) {
    return await this.trainService.update(id, updateTrainDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a train' })
  @ApiResponse({ status: 200, description: 'Train deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.trainService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
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
