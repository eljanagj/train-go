import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Schedule } from '../../schedule/schedule.entity';
import { Seat } from '../../seats/entities/seat.entity';
import { TrainStatus } from './train-status.enum';
import { Maintenance } from '../../maintenance/entities/maintenance.entity';

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

  @OneToMany(() => Maintenance, maintenance => maintenance.train)
  maintenance: Maintenance[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
