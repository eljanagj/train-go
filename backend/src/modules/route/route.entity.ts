import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Schedule } from '../schedule/schedule.entity';
import { Train } from '../train/entities/train.entity';
import { Station } from '../station/entities/station.entity';

@Entity()
export class Route {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Station, { eager: true })
  @JoinColumn({ name: 'departureStationId' })
  departureStation: Station;

  @ManyToOne(() => Station, { eager: true })
  @JoinColumn({ name: 'arrivalStationId' })
  arrivalStation: Station;

  @Column('decimal', { precision: 10, scale: 2, default: 0.0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  capacity: number;

  @Column({ type: 'int', nullable: true })
  trainID: number;

  @ManyToOne(() => Train)
  @JoinColumn({ name: 'trainID' })
  train: Train;

  @OneToMany(() => Schedule, (s) => s.route)
  schedules: Schedule[];
}
