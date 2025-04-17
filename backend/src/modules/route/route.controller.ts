import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { RouteService } from './route.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Controller('routes')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post()
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routeService.create(createRouteDto);
  }

  @Get()
  findAll() {
    return this.routeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routeService.findOne(Number(id));
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
