import { Controller, Get, Post, Body, Param, Put, Delete, Query, ParseIntPipe, BadRequestException, UseGuards } from '@nestjs/common';
import { RouteService } from './route.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('routes')
export class RouteController {
  constructor(
    private readonly routeService: RouteService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Post()
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routeService.create(createRouteDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.routeService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async search(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.routeService.search(from, to);
  }

  @UseGuards(JwtAuthGuard)
  @Get('autocomplete')
  async autocomplete(@Query('prefix') prefix: string) {
    return this.routeService.autocompleteStations(prefix);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.routeService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Put(':id')
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routeService.update(Number(id), updateRouteDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routeService.remove(Number(id));
  }
}
