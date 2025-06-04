import { IsEnum, IsString, IsDate, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MaintenanceStatus, MaintenanceType, MaintenancePriority } from '../entities/maintenance.entity';

export class CreateMaintenanceDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  trainId: number;

  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;

  @IsEnum(MaintenanceType)
  maintenanceType: MaintenanceType;

  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @IsString()
  description: string;

  @IsDate()
  @Type(() => Date)
  scheduledDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  completedDate?: Date;

  @IsString()
  assignedTechnician: string;

  @IsString()
  @IsOptional()
  partsRequired?: string;

  @IsNumber()
  @IsOptional()
  estimatedDuration?: number;

  @IsString()
  @IsOptional()
  location?: string;
} 