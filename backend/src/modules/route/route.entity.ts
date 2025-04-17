import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Route {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    trainId: number;

    @Column()
    departureStation: string;

    @Column()
    arrivalStation: string;

    @Column('decimal')
    price: number;
  }
  