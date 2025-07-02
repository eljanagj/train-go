import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route } from './route.entity';
import { Train } from '../train/entities/train.entity';
import { Station } from '../station/entities/station.entity';

@Injectable()
export class RouteService implements OnModuleInit {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(Train)
    private readonly trainRepository: Repository<Train>,
    @InjectRepository(Station)
    private readonly stationRepository: Repository<Station>,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    await this.indexAllRoutesInRedis();
  }

  private async indexAllRoutesInRedis() {
    const redisClient = this.redisService.getClient();
    const allRoutes = await this.routeRepository.find({
      relations: ['departureStation', 'arrivalStation'],
    });
    // Clear previous indexes
    await redisClient.del(
      'routes:index:from',
      'routes:index:to',
      'routes:autocomplete:stations',
    );
    for (const route of allRoutes) {
      await this.indexRouteInRedis(route);
    }
  }

  private async indexRouteInRedis(route: Route) {
    const redisClient = this.redisService.getClient();
    // Store route as hash
    await redisClient.hset(
      'routes:data',
      route.id.toString(),
      JSON.stringify(route),
    );
    // Index by departure/arrival station names
    await redisClient.sadd(
      `routes:from:${route.departureStation.name}`,
      route.id.toString(),
    );
    await redisClient.sadd(
      `routes:to:${route.arrivalStation.name}`,
      route.id.toString(),
    );
    // For autocomplete
    await redisClient.zadd(
      'routes:autocomplete:stations',
      0,
      route.departureStation.name,
    );
    await redisClient.zadd(
      'routes:autocomplete:stations',
      0,
      route.arrivalStation.name,
    );
  }

  private async removeRouteFromRedis(route: Route) {
    const redisClient = this.redisService.getClient();
    await redisClient.hdel('routes:data', route.id.toString());
    await redisClient.srem(
      `routes:from:${route.departureStation.name}`,
      route.id.toString(),
    );
    await redisClient.srem(
      `routes:to:${route.arrivalStation.name}`,
      route.id.toString(),
    );
    // Optionally, do not remove from autocomplete set for station popularity
  }

  async create(createRouteDto: CreateRouteDto): Promise<Route> {
    // Get the selected train
    const train = await this.trainRepository.findOneBy({
      trainID: createRouteDto.trainID,
    });
    if (!train) {
      throw new BadRequestException('Selected train not found');
    }
    // Get the selected stations
    const departureStation = await this.stationRepository.findOne({
      where: { stationID: createRouteDto.departureStationId },
    });
    if (!departureStation) {
      throw new BadRequestException('Departure station not found');
    }
    const arrivalStation = await this.stationRepository.findOne({
      where: { stationID: createRouteDto.arrivalStationId },
    });
    if (!arrivalStation) {
      throw new BadRequestException('Arrival station not found');
    }
    // Create route with train's capacity and trainID
    const newRoute = this.routeRepository.create({
      price: createRouteDto.price,
      trainID: createRouteDto.trainID,
      train: train,
      capacity: train.totalCapacity,
      departureStation: departureStation,
      arrivalStation: arrivalStation,
    });
    const savedRoute = await this.routeRepository.save(newRoute);
    await this.indexRouteInRedis(savedRoute);
    return savedRoute;
  }

  async findAll(): Promise<Route[]> {
    return this.routeRepository.find({
      relations: ['train', 'departureStation', 'arrivalStation'],
    });
  }

  async findOne(id: number): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['departureStation', 'arrivalStation', 'train'],
    });
    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }
    return route;
  }

  async update(
    id: number,
    updateRouteDto: UpdateRouteDto,
  ): Promise<Route | null> {
    const existingRoute = await this.routeRepository.findOne({
      where: { id },
      relations: ['departureStation', 'arrivalStation', 'train'],
    });
    if (!existingRoute) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }
    // If train is being updated, get its capacity
    if (updateRouteDto.trainID !== undefined) {
      const train = await this.trainRepository.findOneBy({
        trainID: updateRouteDto.trainID,
      });
      if (!train) {
        throw new BadRequestException('Selected train not found');
      }
      existingRoute.capacity = train.totalCapacity;
      existingRoute.trainID = updateRouteDto.trainID;
      existingRoute.train = train;
    }
    // If stations are being updated
    if (updateRouteDto.departureStationId !== undefined) {
      const departureStation = await this.stationRepository.findOne({
        where: { stationID: updateRouteDto.departureStationId },
      });
      if (!departureStation) {
        throw new BadRequestException('Departure station not found');
      }
      existingRoute.departureStation = departureStation;
    }
    if (updateRouteDto.arrivalStationId !== undefined) {
      const arrivalStation = await this.stationRepository.findOne({
        where: { stationID: updateRouteDto.arrivalStationId },
      });
      if (!arrivalStation) {
        throw new BadRequestException('Arrival station not found');
      }
      existingRoute.arrivalStation = arrivalStation;
    }
    if (updateRouteDto.price !== undefined) {
      existingRoute.price = updateRouteDto.price;
    }
    if (updateRouteDto.capacity !== undefined) {
      existingRoute.capacity = updateRouteDto.capacity;
    }
    await this.routeRepository.save(existingRoute);
    const updatedRoute = await this.findOne(id);
    await this.indexRouteInRedis(updatedRoute);
    return updatedRoute;
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['departureStation', 'arrivalStation'],
    });
    const result = await this.routeRepository.delete(id);
    if (route) {
      await this.removeRouteFromRedis(route);
    }
    return { deleted: (result.affected ?? 0) > 0 };
  }

  async search(from: string, to: string): Promise<Route[]> {
    if (!from || !to) {
      throw new BadRequestException(
        'Both "from" and "to" query parameters are required',
      );
    }
    const redisClient = this.redisService.getClient();
    // Try Redis set intersection for fast lookup
    const fromSet = `routes:from:${from}`;
    const toSet = `routes:to:${to}`;
    const routeIds = await redisClient.sinter(fromSet, toSet);
    if (routeIds && routeIds.length > 0) {
      const routesRaw = await redisClient.hmget('routes:data', ...routeIds);
      const routes = routesRaw
        .filter((r): r is string => r !== null)
        .map((r) => JSON.parse(r));
      if (routes.length > 0) {
        // Filter out routes with decommissioned trains
        const filteredRoutes = await Promise.all(
          routes.map(async (route) => {
            const train = await this.trainRepository.findOneBy({
              trainID: route.trainID,
            });
            return train && train.status !== 'DECOMMISSIONED' ? route : null;
          }),
        );
        const activeRoutes = filteredRoutes.filter(
          (r): r is Route => r !== null,
        );
        if (activeRoutes.length > 0) {
          return activeRoutes;
        }
      }
    }
    // Fallback to Postgres with train status filter
    const routes = await this.routeRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.train', 'train')
      .leftJoinAndSelect('route.departureStation', 'departureStation')
      .leftJoinAndSelect('route.arrivalStation', 'arrivalStation')
      .where('departureStation.name = :from', { from })
      .andWhere('arrivalStation.name = :to', { to })
      .andWhere('train.status != :status', { status: 'DECOMMISSIONED' })
      .getMany();
    if (routes.length === 0) {
      return [];
    }
    // Sync Redis
    for (const route of routes) {
      await this.indexRouteInRedis(route);
    }
    return routes;
  }

  async autocompleteStations(prefix: string): Promise<string[]> {
    if (!prefix) return [];
    const redisClient = this.redisService.getClient();
    // Use ZRANGEBYLEX for prefix search
    const min = `[${prefix}`;
    const max = `[${prefix}\xff`;
    const stations = await redisClient.zrangebylex(
      'routes:autocomplete:stations',
      min,
      max,
      'LIMIT',
      0,
      10,
    );
    return stations;
  }
}
