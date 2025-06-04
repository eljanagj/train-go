import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MaintenanceService } from './maintenance.service';

@Injectable()
export class MaintenanceScheduler {
  private readonly logger = new Logger(MaintenanceScheduler.name);

  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Cron('0 * * * *') // Run every hour
  async handleOverdueMaintenance() {
    this.logger.log('Checking for overdue maintenance...');
    try {
      await this.maintenanceService.checkOverdueMaintenance();
      this.logger.log('Overdue maintenance check completed');
    } catch (error) {
      this.logger.error('Error checking overdue maintenance:', error);
    }
  }
} 