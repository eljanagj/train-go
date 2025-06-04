import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { MaintenanceStatus, MaintenancePriority } from './entities/maintenance.entity';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  create(@Body() createMaintenanceDto: CreateMaintenanceDto) {
    return this.maintenanceService.create(createMaintenanceDto);
  }

  @Get()
  findAll() {
    return this.maintenanceService.findAll();
  }

  @Get('active')
  getActiveMaintenance() {
    return this.maintenanceService.getActiveMaintenance();
  }

  @Get('train/:trainId')
  getTrainMaintenanceHistory(@Param('trainId') trainId: string) {
    return this.maintenanceService.getTrainMaintenanceHistory(trainId);
  }

  @Get('priority/:priority')
  getMaintenanceByPriority(@Param('priority') priority: MaintenancePriority) {
    return this.maintenanceService.getMaintenanceByPriority(priority);
  }

  @Get('date-range')
  getMaintenanceByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.maintenanceService.getMaintenanceByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('upcoming')
  getUpcomingMaintenance() {
    return this.maintenanceService.getUpcomingMaintenance();
  }

  @Get('stats')
  getStats() {
    return this.maintenanceService.getMaintenanceStats();
  }

  @Get('trends')
  getTrends() {
    return this.maintenanceService.getMaintenanceTrends();
  }

  @Get('recent')
  getRecent() {
    return this.maintenanceService.getRecentActivity();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMaintenanceDto: UpdateMaintenanceDto) {
    return this.maintenanceService.update(id, updateMaintenanceDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: MaintenanceStatus,
  ) {
    return this.maintenanceService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.maintenanceService.remove(id);
  }
} 