import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Schedule } from '../../schedule/schedule.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { Seat } from '../../seats/entities/seat.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  PAYMENT_PENDING = 'payment_pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  scheduleId: number;

  @ManyToMany(() => Seat)
  @JoinTable({
    name: 'reservation_seats',
    joinColumn: { name: 'reservationId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'seatId', referencedColumnName: 'id' },
  })
  seats: Seat[];

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

  @Column({ type: 'timestamp', nullable: true })
  travelDate: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  discountCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancellationReason: string;

  @Column({ type: 'timestamp', nullable: true })
  cancellationDate: Date;

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