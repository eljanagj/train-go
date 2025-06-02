import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Train } from '../../train/entities/train.entity';

export enum SeatType {
  WINDOW = 'window',
  AISLE = 'aisle',
  MIDDLE = 'middle'
}

export enum SeatClass {
  PREMIUM = 'premium',
  BUSINESS = 'business',
  ECONOMY = 'economy'
}

export enum SeatStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  OCCUPIED = 'occupied'
}

@Entity('seats')
export class Seat {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  trainId: number;

  @Column({ type: 'varchar', length: 10 })
  seatNumber: string;

  @Column({
    type: 'enum',
    enum: SeatType,
    default: SeatType.MIDDLE
  })
  type: SeatType;

  @Column({
    type: 'enum',
    enum: SeatClass,
    default: SeatClass.ECONOMY
  })
  class: SeatClass;

  @Column({
    type: 'enum',
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE
  })
  status: SeatStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 100 })
  location: string; // e.g., "Front", "Middle", "Back"

  @Column({ type: 'int' })
  row: number;

  @Column({ type: 'varchar', length: 1 })
  position: string;

  @ManyToOne(() => Train, train => train.seats)
  @JoinColumn({ name: 'trainId' })
  train: Train;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 