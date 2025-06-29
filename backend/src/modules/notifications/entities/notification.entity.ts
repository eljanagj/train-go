import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('notifications')
export class Notification {
  @ApiProperty({ description: 'Unique identifier of the notification' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'The notification message content' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ description: 'Whether this is an admin-only notification' })
  @Column({ type: 'boolean', default: false })
  isAdminNotification: boolean;

  @ApiProperty({ description: 'Array of user IDs who have read this notification' })
  @Column('simple-array', { default: '{}' })
  readBy: string[]; // Array of user IDs who have read the notification

  @ApiProperty({ description: 'Optional specific user target (undefined means broadcast)', required: false })
  @Column({ type: 'varchar', nullable: true })
  userId?: string; // Optional: specific user target, undefined means broadcast

  @ApiProperty({ description: 'When the notification was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When the notification was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
} 