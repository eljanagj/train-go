import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TrainStatus } from './train-status.enum';
//import { TrainStatusHistory } from './train-status-history.entity';

@Entity('trains')
export class Train {
  @PrimaryGeneratedColumn({ name: 'trainID' })
  trainID: number;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer?: string;

  @Column({ type: 'int', nullable: true })
  productionYear?: number;

  @Column({
    type: 'enum',
    enum: TrainStatus,
    default: TrainStatus.ACTIVE,
  })
  status: TrainStatus;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Future relationship example: when you implement a Seat entity
  // @OneToMany(() => Seat, (seat) => seat.train)
  // seats: Seat[];

  //@OneToMany(() => TrainStatusHistory, (h) => h.train)
  //statusHistory: TrainStatusHistory[];
}
