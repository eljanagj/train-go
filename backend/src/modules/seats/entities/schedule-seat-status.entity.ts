import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('schedule_seat_status')
@Index(['trainId', 'travelDate', 'departureTime', 'seatNumber'], { unique: true })
export class ScheduleSeatStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  trainId: number;

  @Column({ type: 'date' })
  travelDate: string;

  @Column({ type: 'varchar', length: 5 })
  departureTime: string;

  @Column({ type: 'varchar', length: 10 })
  seatNumber: string;

  @Column({ type: 'varchar', length: 64, default: 'available' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
