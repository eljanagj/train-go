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

  @Column({ type: 'timestamp' })
  departureTime: Date;

  @Column({ type: 'timestamp' })
  arrivalTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
