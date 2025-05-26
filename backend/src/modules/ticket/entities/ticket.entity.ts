import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Reservation } from '../../reservation/entities/reservation.entity';

export enum TicketStatus {
  PENDING = 'pending',
  GENERATED = 'generated',
  DOWNLOADED = 'downloaded',
  EXPIRED = 'expired'
}

export enum TicketType {
  STANDARD = 'standard',
  RECEIPT = 'receipt',
  REFUND = 'refund'
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reservationId: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  ticketNumber: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.PENDING
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketType,
    default: TicketType.STANDARD
  })
  type: TicketType;

  @Column({ type: 'timestamp', nullable: true })
  generatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  downloadedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @Column({ type: 'varchar', nullable: true })
  pdfPath: string;

  @Column({ type: 'varchar', nullable: true })
  qrCode: string;

  @Column({ type: 'text', nullable: true })
  metadata: string; 

  @OneToOne(() => Reservation, reservation => reservation.ticket)
  @JoinColumn({ name: 'reservationId' })
  reservation: Reservation;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
