import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Train } from '../train/entities/train.entity';
import { Route } from '../route/route.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Train, (train) => train.schedules, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainID' })
  train: Train;

  @ManyToOne(() => Route, (route) => route.schedules, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routeID' })
  route: Route;

  @Column({ type: 'varchar', length: 5 })
  departureTime: string;

  @Column({ type: 'varchar', length: 5 })
  arrivalTime: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
