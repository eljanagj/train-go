import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    console.log('Creating notification:', createNotificationDto);
    const notification = this.notificationsRepository.create(createNotificationDto);
    return this.notificationsRepository.save(notification);
  }

  async findAll(userId: string, isAdmin: boolean) {
    
    const whereClause = isAdmin 
      ? { isAdminNotification: true }
      : { 
          isAdminNotification: false,
          userId: userId 
        };

    const notifications = await this.notificationsRepository.find({
      where: whereClause,
      order: { createdAt: 'DESC' }
    });
    
    return notifications;
  }

  async findAllAdmin() {
    const notifications = await this.notificationsRepository.find({
      where: { isAdminNotification: true },
      order: { createdAt: 'DESC' }
    });
    return notifications;
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationsRepository.findOne({ where: { id } });
    if (!notification) {
      throw new Error('Notification not found');
    }
    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
      await this.notificationsRepository.save(notification);
    }
    return notification;
  }

  async markAllAsRead(userId: string) {
    const notifications = await this.notificationsRepository.find({
      where: { userId }
    });
    
    for (const notification of notifications) {
      if (!notification.readBy.includes(userId)) {
        notification.readBy.push(userId);
        await this.notificationsRepository.save(notification);
      }
    }
    
    return this.findAll(userId, false);
  }

  async sendNotification(message: string, role: 'Admin' | 'User', userId?: string) {
    const notification = this.notificationsRepository.create({
      message,
      isAdminNotification: role === 'Admin',
      userId: userId || undefined,
      readBy: [],
    });

    const savedNotification = await this.notificationsRepository.save(notification);

    // Emit to WebSocket clients
    if (role === 'Admin') {
      // Only send to admin room
      this.notificationsGateway.server.to('admin').emit('notification', savedNotification);
    } else if (userId) {
      // Only send to specific user's room
      this.notificationsGateway.server.to(userId).emit('notification', savedNotification);
    }

    return savedNotification;
  }

  async getUserNotifications(userId: string, isAdmin: boolean) {
    const query = this.notificationsRepository.createQueryBuilder('notification')
      .where('notification.isAdminNotification = :isAdmin', { isAdmin })
      .andWhere('(notification.userId IS NULL OR notification.userId = :userId)', { userId })
      .orderBy('notification.createdAt', 'DESC');

    return query.getMany();
  }
}
