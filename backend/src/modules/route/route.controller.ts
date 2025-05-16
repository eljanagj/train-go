import { Controller, Get, Post, Body, Param, Put, Delete, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { RouteService } from './route.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Controller('routes')
export class RouteController {
  constructor(
    private readonly routeService: RouteService,
  ) {}

  @Post()
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routeService.create(createRouteDto);
  }

  @Get()
  findAll() {
    return this.routeService.findAll();
  }

  @Get('search')
  async search(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.routeService.search(from, to);
  }

  @Get('autocomplete')
  async autocomplete(@Query('prefix') prefix: string) {
    return this.routeService.autocompleteStations(prefix);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.routeService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routeService.update(Number(id), updateRouteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routeService.remove(Number(id));
  }
}
