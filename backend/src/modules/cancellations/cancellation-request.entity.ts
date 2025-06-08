import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Reservation } from '../reservation/entities/reservation.entity';
import { User } from '../user/entities/user.entity';

export enum CancellationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('cancellation_requests')
export class CancellationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Reservation, { eager: true })
  reservation: Reservation;

  @ManyToOne(() => User, { nullable: true, eager: true })
  reviewedBy?: User;

  @Column()
  reason: string;

  @Column({ type: 'enum', enum: CancellationStatus, default: CancellationStatus.PENDING })
  status: CancellationStatus;

  @Column({ nullable: true })
  adminNotes?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 