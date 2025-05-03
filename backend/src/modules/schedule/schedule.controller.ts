import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';

@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  async create(@Body() body: {
    trainID: number;
    routeID: number;
    departureTime: string;
    arrivalTime: string;
  }) {
    return this.scheduleService.createSchedule(
      body.trainID,
      body.routeID,
      new Date(body.departureTime),
      new Date(body.arrivalTime),
    );
  }

  @Get()
  async findAll() {
    return this.scheduleService.getAll();
  }

  @Get('train/:trainID')
  async findByTrain(@Param('trainID', ParseIntPipe) trainID: number) {
    return this.scheduleService.getByTrain(trainID);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.scheduleService.deleteSchedule(id);
    return { message: 'Schedule deleted' };
  }
}
