import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Schedule } from '../../schedule/schedule.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { Ticket } from '../../ticket/entities/ticket.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  PAYMENT_PENDING = 'payment_pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  scheduleId: number;

  @Column({ type: 'varchar', length: 10 })
  seatNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  passengerName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  passengerSurname: string;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING
  })
  status: ReservationStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'timestamp' })
  reservationDate: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Schedule, { eager: true })
  @JoinColumn({ name: 'scheduleId' })
  schedule: Schedule;

  @OneToOne(() => Payment, payment => payment.reservation, { cascade: true })
  payment: Payment;

  @OneToOne(() => Ticket, ticket => ticket.reservation, { cascade: true })
  ticket: Ticket;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}