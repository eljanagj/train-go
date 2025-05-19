import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Schedule } from '../../schedule/schedule.entity';
import { Seat } from '../../seats/entities/seat.entity';

export enum TrainStatus {
  ACTIVE = 'ACTIVE',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  DELAYED = 'DELAYED',
  MAINTENANCE = 'MAINTENANCE',
  DECOMMISSIONED = 'DECOMMISSIONED'
}

@Entity('trains')
export class Train {
  @PrimaryGeneratedColumn({ name: 'trainID' })
  trainID: number;

  @Column({type: 'varchar', length: 100})
  trainName: string;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'int' })
  totalCapacity: number;

  @Column({ type: 'int' })
  availableSeats: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer?: string;

  @Column({ type: 'int', nullable: true })
  productionYear?: number;

  @Column({
    type: 'enum',
    enum: TrainStatus,
    default: TrainStatus.ACTIVE,
  })
  status: TrainStatus;

  @OneToMany(() => Schedule, schedule => schedule.train)
  schedules: Schedule[];

  @OneToMany(() => Seat, seat => seat.train)
  seats: Seat[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
