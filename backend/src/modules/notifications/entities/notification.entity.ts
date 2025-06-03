import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum NotificationType {
  RESERVATION_CREATED = 'RESERVATION_CREATED',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM_NOTIFICATION
  })
  type: NotificationType;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;
} 