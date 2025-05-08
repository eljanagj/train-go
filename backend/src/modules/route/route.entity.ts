import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Schedule } from '../schedule/schedule.entity';

@Entity()
export class Route {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100 })
    departureStation: string;

    @Column({ type: 'varchar', length: 100 })
    arrivalStation: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0.00 })
    price: number;

    @OneToMany(() => Schedule, (s) => s.route)
    schedules: Schedule[];
    
}
  