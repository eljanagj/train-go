import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Train } from '../../train/entities/train.entity';

export enum MaintenanceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OUT_OF_SERVICE = 'out_of_service',
  SCHEDULED = 'scheduled',
  OVERDUE = 'overdue'
}

export enum MaintenanceType {
  ROUTINE = 'routine',
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  EMERGENCY = 'emergency'
}

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

@Entity('maintenance')
export class Maintenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Train, train => train.maintenance)
  train: Train;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.PENDING
  })
  status: MaintenanceStatus;

  @Column({
    type: 'enum',
    enum: MaintenanceType
  })
  maintenanceType: MaintenanceType;

  @Column({
    type: 'enum',
    enum: MaintenancePriority,
    default: MaintenancePriority.MEDIUM
  })
  priority: MaintenancePriority;

  @Column()
  description: string;

  @Column({ type: 'timestamp' })
  scheduledDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedDate: Date;

  @Column({ type: 'varchar', length: 100 })
  assignedTechnician: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  partsRequired: string;

  @Column({ type: 'int', nullable: true })
  estimatedDuration: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 