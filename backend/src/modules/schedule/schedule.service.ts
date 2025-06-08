import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './schedule.entity';
import { Train } from '../train/entities/train.entity';
import { Route } from '../route/route.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,

    @InjectRepository(Train)
    private readonly trainRepo: Repository<Train>,

    @InjectRepository(Route)
    private readonly routeRepo: Repository<Route>,
  ) {}

  async createSchedule(
    trainID: number,
    routeID: number,
    departureTime: string,
    arrivalTime: string,
  ): Promise<Schedule> {
    const train = await this.trainRepo.findOneBy({ trainID });
    if (!train) throw new NotFoundException('Train not found');

    const route = await this.routeRepo.findOneBy({ id: routeID });
    if (!route) throw new NotFoundException('Route not found');

    const schedule = this.scheduleRepo.create({
      train,
      route,
      departureTime,
      arrivalTime,
    });

    // Extract only the time portion before saving to the database
    const departureTimeOnly = schedule.departureTime.split('T')[1].substring(0, 5);
    const arrivalTimeOnly = schedule.arrivalTime.split('T')[1].substring(0, 5);

    // Use these extracted time strings when creating or updating the schedule
    schedule.departureTime = departureTimeOnly;
    schedule.arrivalTime = arrivalTimeOnly;

    return this.scheduleRepo.save(schedule);
  }

  async updateSchedule(
    id: number,
    trainID: number,
    routeID: number,
    departureTime: string,
    arrivalTime: string,
  ): Promise<Schedule> {
    const schedule = await this.scheduleRepo.findOneBy({ id });
    if (!schedule) throw new NotFoundException('Schedule not found');

    const train = await this.trainRepo.findOneBy({ trainID });
    if (!train) throw new NotFoundException('Train not found');

    const route = await this.routeRepo.findOneBy({ id: routeID });
    if (!route) throw new NotFoundException('Route not found');

    schedule.train = train;
    schedule.route = route;
    schedule.departureTime = departureTime;
    schedule.arrivalTime = arrivalTime;

    // Extract only the time portion before saving to the database
    const departureTimeOnly = schedule.departureTime.split('T')[1].substring(0, 5);
    const arrivalTimeOnly = schedule.arrivalTime.split('T')[1].substring(0, 5);

    // Use these extracted time strings when creating or updating the schedule
    schedule.departureTime = departureTimeOnly;
    schedule.arrivalTime = arrivalTimeOnly;

    return this.scheduleRepo.save(schedule);
  }

  async getAll(): Promise<Schedule[]> {
    return this.scheduleRepo.find();
  }

  async getByTrain(trainID: number): Promise<Schedule[]> {
    return this.scheduleRepo.find({
      where: {
        train: {
          trainID,
        },
      },
      relations: ['route', 'train'],
      order: {
        departureTime: 'ASC',
      },
    });
  }

  async getByRoute(routeId: number): Promise<Schedule[]> {
    return this.scheduleRepo.find({
      where: {
        route: {
          id: routeId,
        },
      },
      relations: ['route', 'train'],
      order: {
        departureTime: 'ASC',
      },
    });
  }

  async deleteSchedule(id: number): Promise<void> {
    const result = await this.scheduleRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Schedule not found');
  }
}
