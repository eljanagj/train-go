import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { StationService } from './station.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('stations')
@Controller('stations')
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Post()
  @ApiOperation({ summary: 'Create a new station' })
  @ApiResponse({ status: 201, description: 'Station created successfully' })
  async create(@Body() createStationDto: CreateStationDto) {
    return await this.stationService.create(createStationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all stations' })
  @ApiResponse({ status: 200, description: 'Returns list of stations' })
  async findAll() {
    return await this.stationService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active stations' })
  @ApiResponse({ status: 200, description: 'Returns list of active stations' })
  async findActiveStations() {
    return await this.stationService.findActiveStations();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search stations by name or location' })
  @ApiResponse({ status: 200, description: 'Returns matching stations' })
  async searchStations(@Query('q') query: string) {
    return await this.stationService.searchStations(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a station by ID' })
  @ApiResponse({ status: 200, description: 'Returns the station' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.stationService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a station' })
  @ApiResponse({ status: 200, description: 'Station updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStationDto: UpdateStationDto,
  ) {
    return await this.stationService.update(id, updateStationDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a station' })
  @ApiResponse({ status: 200, description: 'Station deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.stationService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update station status' })
  @ApiResponse({
    status: 200,
    description: 'Station status updated successfully',
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
  ) {
    return this.stationService.updateStatus(id, body.status);
  }
}
