import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Schedule } from '../schedule/schedule.entity';

@Entity()
export class Route {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    departureStation: string;

    @Column()
    arrivalStation: string;

    @Column('decimal')
    price: number;

    @OneToMany(() => Schedule, (s) => s.route)
    schedules: Schedule[];


  }
  