import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route } from './route.entity';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
  ) {}

  async create(createRouteDto: CreateRouteDto): Promise<Route> {
    const newRoute = this.routeRepository.create(createRouteDto);
    return this.routeRepository.save(newRoute);
  }

  async findAll(): Promise<Route[]> {
    return this.routeRepository.find();
  }

  async findOne(id: number): Promise<Route | null> {
    return this.routeRepository.findOne({
      where: { id }
    });
  }

  async update(id: number, updateRouteDto: UpdateRouteDto): Promise<Route | null> {
    const existingRoute = await this.routeRepository.findOneBy({ id });
    if (!existingRoute) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    await this.routeRepository.update(id, updateRouteDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const result = await this.routeRepository.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
