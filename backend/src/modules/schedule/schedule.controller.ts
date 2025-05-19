import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('schedules')
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

  @Get('route/:routeId')
  async findByRoute(@Param('routeId', ParseIntPipe) routeId: number) {
    return this.scheduleService.getByRoute(routeId);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      trainID: number;
      routeID: number;
      departureTime: string;
      arrivalTime: string;
    },
  ) {
    return this.scheduleService.updateSchedule(
      id,
      body.trainID,
      body.routeID,
      new Date(body.departureTime),
      new Date(body.arrivalTime),
    );
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.scheduleService.deleteSchedule(id);
    return { message: 'Schedule deleted' };
  }
}
