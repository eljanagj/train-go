import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route } from './route.entity';

@Injectable()
export class RouteService implements OnModuleInit {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
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
    const newRoute = this.routeRepository.create(createRouteDto);
    const savedRoute = await this.routeRepository.save(newRoute);
    await this.indexRouteInRedis(savedRoute);
    return savedRoute;
  }

  async findAll(): Promise<Route[]> {
    return this.routeRepository.find();
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
    await this.routeRepository.update(id, updateRouteDto);
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
      if (routes.length > 0) return routes;
    }
    // Fallback to Postgres
    const routes = await this.routeRepository.find({ where: { departureStation: from, arrivalStation: to } });
    if (routes.length === 0) {
      throw new NotFoundException(`No routes found from ${from} to ${to}`);
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
    const stations = await redisClient.zrangebylex('routes:autocomplete:stations', min, max, 'LIMIT', 0, 10);
    return stations;
  }
}
