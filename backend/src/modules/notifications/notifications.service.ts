import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { RedisService } from '../redis/redis.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private redisService: RedisService,
  ) {}

  async createNotification(data: {
    type: NotificationType;
    message: string;
    data?: Record<string, any>;
    userId?: string;
    role?: string;
  }): Promise<Notification> {
    const notification = this.notificationsRepository.create(data);
    const savedNotification = await this.notificationsRepository.save(notification);

    // Update Redis counters
    if (data.userId) {
      await this.incrementUserUnreadCount(data.userId);
    }
    if (data.role) {
      await this.incrementRoleUnreadCount(data.role);
    }

    // Emit the notification through WebSocket
    if (data.userId) {
      this.notificationsGateway.server.to(`user:${data.userId}`).emit('notification', savedNotification);
    }
    if (data.role) {
      this.notificationsGateway.server.to(`role:${data.role}`).emit('notification', savedNotification);
    }

    return savedNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: [
        { userId },
        { role: 'user' }
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async getAdminNotifications(): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { role: 'admin' },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string): Promise<Notification | undefined> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId }
    });

    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      const savedNotification = await this.notificationsRepository.save(notification);

      // Update Redis counters
      if (notification.userId) {
        await this.decrementUserUnreadCount(notification.userId);
      }
      if (notification.role) {
        await this.decrementRoleUnreadCount(notification.role);
      }

      return savedNotification;
    }

    return undefined;
  }

  async markAllAsRead(userId: string, role: string): Promise<void> {
    // Update notifications for both user and role
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    await this.notificationsRepository.update(
      { role, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // Reset Redis counters
    if (userId) {
      await this.resetUserUnreadCount(userId);
    }
    if (role) {
      await this.resetRoleUnreadCount(role);
    }
  }

  private async getRedisClient() {
    const client = this.redisService.getClient();
    if (!client) {
      throw new Error('Redis client is not available');
    }
    return client;
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const redisClient = await this.getRedisClient();
      const count = await redisClient.get(`notifications:unread:user:${userId}`);
      
      if (count !== null) {
        return parseInt(count, 10);
      }

      // If not in Redis, get from DB and cache
      const dbCount = await this.notificationsRepository.count({
        where: [
          { userId, isRead: false },
          { role: 'user', isRead: false }
        ]
      });

      // Cache the count in Redis with a reasonable expiration
      await redisClient.set(`notifications:unread:user:${userId}`, dbCount, 'EX', 3600);
      return dbCount;
    } catch (error) {
      this.logger.error(`Error getting unread count for user ${userId}:`, error);
      // Fallback to database count if Redis fails
      return this.notificationsRepository.count({
        where: [
          { userId, isRead: false },
          { role: 'user', isRead: false }
        ]
      });
    }
  }

  async getAdminUnreadCount(): Promise<number> {
    try {
      const redisClient = await this.getRedisClient();
      const count = await redisClient.get('notifications:unread:role:admin');
      
      if (count !== null) {
        return parseInt(count, 10);
      }

      // If not in Redis, get from DB and cache
      const dbCount = await this.notificationsRepository.count({
        where: { role: 'admin', isRead: false }
      });

      // Cache the count in Redis with a reasonable expiration
      await redisClient.set('notifications:unread:role:admin', dbCount, 'EX', 3600);
      return dbCount;
    } catch (error) {
      this.logger.error('Error getting admin unread count:', error);
      // Fallback to database count if Redis fails
      return this.notificationsRepository.count({
        where: { role: 'admin', isRead: false }
      });
    }
  }

  private async incrementUserUnreadCount(userId: string): Promise<void> {
    try {
      const redisClient = await this.getRedisClient();
      const key = `notifications:unread:user:${userId}`;
      const count = await redisClient.get(key);
      
      if (count === null) {
        const dbCount = await this.notificationsRepository.count({
          where: [
            { userId, isRead: false },
            { role: 'user', isRead: false }
          ]
        });
        await redisClient.set(key, dbCount + 1, 'EX', 3600);
      } else {
        await redisClient.incr(key);
      }
    } catch (error) {
      this.logger.error(`Error incrementing unread count for user ${userId}:`, error);
    }
  }

  private async incrementRoleUnreadCount(role: string): Promise<void> {
    try {
      const redisClient = await this.getRedisClient();
      const key = `notifications:unread:role:${role}`;
      const count = await redisClient.get(key);
      
      if (count === null) {
        const dbCount = await this.notificationsRepository.count({
          where: { role, isRead: false }
        });
        await redisClient.set(key, dbCount + 1, 'EX', 3600);
      } else {
        await redisClient.incr(key);
      }
    } catch (error) {
      this.logger.error(`Error incrementing unread count for role ${role}:`, error);
    }
  }

  private async decrementUserUnreadCount(userId: string): Promise<void> {
    try {
      const redisClient = await this.getRedisClient();
      const key = `notifications:unread:user:${userId}`;
      const count = await redisClient.get(key);
      
      if (count === null) {
        const dbCount = await this.notificationsRepository.count({
          where: [
            { userId, isRead: false },
            { role: 'user', isRead: false }
          ]
        });
        await redisClient.set(key, Math.max(0, dbCount - 1), 'EX', 3600);
      } else {
        const newCount = Math.max(0, parseInt(count, 10) - 1);
        await redisClient.set(key, newCount, 'EX', 3600);
      }
    } catch (error) {
      this.logger.error(`Error decrementing unread count for user ${userId}:`, error);
    }
  }

  private async decrementRoleUnreadCount(role: string): Promise<void> {
    try {
      const redisClient = await this.getRedisClient();
      const key = `notifications:unread:role:${role}`;
      const count = await redisClient.get(key);
      
      if (count === null) {
        const dbCount = await this.notificationsRepository.count({
          where: { role, isRead: false }
        });
        await redisClient.set(key, Math.max(0, dbCount - 1), 'EX', 3600);
      } else {
        const newCount = Math.max(0, parseInt(count, 10) - 1);
        await redisClient.set(key, newCount, 'EX', 3600);
      }
    } catch (error) {
      this.logger.error(`Error decrementing unread count for role ${role}:`, error);
    }
  }

  private async resetUserUnreadCount(userId: string): Promise<void> {
    try {
      const redisClient = await this.getRedisClient();
      await redisClient.set(`notifications:unread:user:${userId}`, 0, 'EX', 3600);
    } catch (error) {
      this.logger.error(`Error resetting unread count for user ${userId}:`, error);
    }
  }

  private async resetRoleUnreadCount(role: string): Promise<void> {
    try {
      const redisClient = await this.getRedisClient();
      await redisClient.set(`notifications:unread:role:${role}`, 0, 'EX', 3600);
    } catch (error) {
      this.logger.error(`Error resetting unread count for role ${role}:`, error);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId }
    });

    if (notification) {
      await this.notificationsRepository.delete(notificationId);

      // Update Redis counters if notification was unread
      if (!notification.isRead) {
        if (notification.userId) {
          await this.decrementUserUnreadCount(notification.userId);
        }
        if (notification.role) {
          await this.decrementRoleUnreadCount(notification.role);
        }
      }
    }
  }

  async deleteOldNotifications(days: number = 30): Promise<void> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    await this.notificationsRepository.delete({
      createdAt: LessThan(date)
    });
  }
} 