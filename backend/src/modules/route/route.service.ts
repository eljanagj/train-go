import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route } from './route.entity';
import { Train } from '../train/entities/train.entity';

@Injectable()
export class RouteService implements OnModuleInit {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(Train)
    private readonly trainRepository: Repository<Train>,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    await this.indexAllRoutesInRedis();
  }

  private async indexAllRoutesInRedis() {
    const redisClient = this.redisService.getClient();
    const allRoutes = await this.routeRepository.find();
    // Clear previous indexes
    await redisClient.del('routes:index:from', 'routes:index:to', 'routes:autocomplete:stations');
    for (const route of allRoutes) {
      await this.indexRouteInRedis(route);
    }
  }

  private async indexRouteInRedis(route: Route) {
    const redisClient = this.redisService.getClient();
    // Store route as hash
    await redisClient.hset('routes:data', route.id.toString(), JSON.stringify(route));
    // Index by departure/arrival
    await redisClient.sadd(`routes:from:${route.departureStation}`, route.id.toString());
    await redisClient.sadd(`routes:to:${route.arrivalStation}`, route.id.toString());
    // For autocomplete
    await redisClient.zadd('routes:autocomplete:stations', 0, route.departureStation);
    await redisClient.zadd('routes:autocomplete:stations', 0, route.arrivalStation);
  }

  private async removeRouteFromRedis(route: Route) {
    const redisClient = this.redisService.getClient();
    await redisClient.hdel('routes:data', route.id.toString());
    await redisClient.srem(`routes:from:${route.departureStation}`, route.id.toString());
    await redisClient.srem(`routes:to:${route.arrivalStation}`, route.id.toString());
    // Optionally, do not remove from autocomplete set for station popularity
  }

  async create(createRouteDto: CreateRouteDto): Promise<Route> {
    // Get the selected train
    const train = await this.trainRepository.findOneBy({ trainID: createRouteDto.trainID });
    if (!train) {
      throw new BadRequestException('Selected train not found');
    }

    // Create route with train's capacity and trainID
    const newRoute = this.routeRepository.create({
      ...createRouteDto,
      capacity: train.totalCapacity,
      trainID: createRouteDto.trainID
    });

    const savedRoute = await this.routeRepository.save(newRoute);
    await this.indexRouteInRedis(savedRoute);
    return savedRoute;
  }

  async findAll(): Promise<Route[]> {
    return this.routeRepository.find({
      relations: ['train']
    });
  }

  async findOne(id: number): Promise<Route> {
    const route = await this.routeRepository.findOne({ where: { id } });
    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }
    return route;
  }

  async update(id: number, updateRouteDto: UpdateRouteDto): Promise<Route | null> {
    const existingRoute = await this.routeRepository.findOneBy({ id });
    if (!existingRoute) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    // If train is being updated, get its capacity
    if (updateRouteDto.trainID !== undefined) {
      const train = await this.trainRepository.findOneBy({ trainID: updateRouteDto.trainID });
      if (!train) {
        throw new BadRequestException('Selected train not found');
      }
      // Create a new object with the updated capacity and trainID
      const updatedData = {
        ...updateRouteDto,
        capacity: train.totalCapacity,
        trainID: updateRouteDto.trainID
      };
      await this.routeRepository.update(id, updatedData);
    } else {
      // If train is not being updated, just update the other fields
      await this.routeRepository.update(id, updateRouteDto);
    }

    const updatedRoute = await this.findOne(id);
    await this.indexRouteInRedis(updatedRoute);
    return updatedRoute;
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const route = await this.routeRepository.findOneBy({ id });
    const result = await this.routeRepository.delete(id);
    if (route) {
      await this.removeRouteFromRedis(route);
    }
    return { deleted: (result.affected ?? 0) > 0 };
  }

  async search(from: string, to: string): Promise<Route[]> {
    if (!from || !to) {
      throw new BadRequestException('Both "from" and "to" query parameters are required');
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
        .map(r => JSON.parse(r));
      if (routes.length > 0) {
        // Filter out routes with decommissioned trains
        const filteredRoutes = await Promise.all(
          routes.map(async (route) => {
            const train = await this.trainRepository.findOneBy({ trainID: route.trainID });
            return train && train.status !== 'DECOMMISSIONED' ? route : null;
          })
        );
        const activeRoutes = filteredRoutes.filter((r): r is Route => r !== null);
        console.log('Redis found routes:', routes.length, 'Active after filter:', activeRoutes.length);
        if (activeRoutes.length > 0) {
          console.log('Returning active routes from Redis:', activeRoutes.length);
          return activeRoutes;
        }
      }
    }

    console.log('No active routes in Redis or Redis lookup failed, falling back to Postgres.');

    // Fallback to Postgres with train status filter
    const routes = await this.routeRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.train', 'train')
      .where('route.departureStation = :from', { from })
      .andWhere('route.arrivalStation = :to', { to })
      .andWhere('train.status != :status', { status: 'DECOMMISSIONED' })
      .getMany();

    if (routes.length === 0) {
      console.log('Postgres found no routes.');
      return []; // Return empty array instead of throwing 404
    }

    console.log('Postgres found routes:', routes.length);

    // Sync Redis
    for (const route of routes) {
      await this.indexRouteInRedis(route);
    }
    console.log('Returning routes from Postgres:', routes.length);
    return routes;
  }

  async autocompleteStations(prefix: string): Promise<string[]> {
    if (!prefix) return [];
    const redisClient = this.redisService.getClient();
    // Use ZRANGEBYLEX for prefix search
    const min = `[${prefix}`;
    const max = `[${prefix}\xff`;
    const stations = await redisClient.zrangebylex('routes:autocomplete:stations', min, max, 'LIMIT', 0, 10);
    return stations;
  }
}
