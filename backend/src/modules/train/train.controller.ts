import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TrainService } from './train.service';
import { CreateTrainDto } from './dto/create-train.dto';
import { UpdateTrainDto } from './dto/update-train.dto';
import { UpdateTrainStatusDto } from './dto/update-train-status.dto';

@ApiTags('trains')
@Controller('trains')
export class TrainController {
  constructor(private readonly trainService: TrainService) {}

  @Post()
  async create(@Body() createTrainDto: CreateTrainDto) {
    return await this.trainService.create(createTrainDto);
  }

  @Get()
  async findAll() {
    return await this.trainService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.trainService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTrainDto: UpdateTrainDto,
  ) {
    return await this.trainService.update(id, updateTrainDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.trainService.remove(id);
  }

  @Patch(':id/status')
async updateStatus(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateTrainStatusDto,
) {
  return this.trainService.updateStatus(id, dto.status);
}

}
