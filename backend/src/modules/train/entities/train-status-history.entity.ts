/* import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
  } from 'typeorm';
  import { Train } from './train.entity';
  import { TrainStatus } from './train-status.enum';
  
  @Entity('train_status_history')
  export class TrainStatusHistory {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => Train, (train) => train.statusHistory, { onDelete: 'CASCADE' })
    train: Train;
  
    @Column({ type: 'enum', enum: TrainStatus })
    fromStatus: TrainStatus;
  
    @Column({ type: 'enum', enum: TrainStatus })
    toStatus: TrainStatus;
  
    @CreateDateColumn()
    changedAt: Date;
  }
  */