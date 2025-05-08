import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TrainStatus } from './train-status.enum';
import { Schedule } from '../../schedule/schedule.entity';

@Entity('trains')
export class Train {
  @PrimaryGeneratedColumn({ name: 'trainID' })
  trainID: number;

  @Column({type: 'varchar', length: 100})
  trainName: string;

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

  @OneToMany(() => Schedule, (s) => s.train)
  schedules: Schedule[];

}
