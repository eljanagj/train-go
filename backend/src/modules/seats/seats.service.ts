// seats.service.ts (Redis-based)
import { Injectable, ConflictException, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import Redis from 'ioredis';

export interface SeatData {
  type: string;
  class: string;
  price: number;
  location: string;
  row: number;
  position: string;
  status?: string;
}

@Injectable()
export class SeatsService implements OnModuleInit {
  private redis: Redis;
  private readonly logger = new Logger(SeatsService.name);

  constructor(private readonly redisService: RedisService) {}

  onModuleInit() {
    try {
      this.redis = this.redisService.getClient();
      this.logger.log('Redis client initialized in SeatsService');
    } catch (error) {
      this.logger.error('Failed to initialize Redis client:', error);
      throw error;
    }
  }

  private getSeatKey(trainId: string, date: string, time: string): string {
    // Format the date to ensure consistency
    const formattedDate = date.includes('T') ? date.split('T')[0] : date;
    return `train:${trainId}:schedule:${formattedDate}:${time}:seats`;
  }

  private getLockKey(trainId: string, date: string, time: string, seatId: string): string {
    const formattedDate = date.includes('T') ? date.split('T')[0] : date;
    return `train:${trainId}:schedule:${formattedDate}:${time}:seat:${seatId}:lock`;
  }

  private getSeatConfigKey(trainId: string): string {
    return `train:${trainId}:seats:config`;
  }

  private getScheduleSeatsKey(trainId: string, date: string, time: string): string {
    const formattedDate = date.includes('T') ? date.split('T')[0] : date;
    return `train:${trainId}:schedule:${formattedDate}:${time}:seats:status`;
  }

  async createSeatsForTrain(trainId: number, seatConfig: any[]) {
    try {
      const configKey = this.getSeatConfigKey(String(trainId));
      
      // Get existing configuration
      const existingConfig = await this.redis.get(configKey);
      const existingSeats: Record<string, SeatData> = existingConfig ? JSON.parse(existingConfig) : {};
      
      // Merge new seats with existing ones
      const newSeats: Record<string, SeatData> = {};
      seatConfig.forEach(seat => {
        newSeats[seat.seatNumber] = {
          type: seat.type,
          class: seat.class,
          price: seat.price,
          location: seat.location,
          row: seat.row,
          position: seat.position,
          status: 'available'
        };
      });

      // Merge configurations
      const mergedConfig = {
        ...existingSeats,
        ...newSeats
      };

      // Save merged configuration
      await this.redis.set(configKey, JSON.stringify(mergedConfig));
      
      this.logger.log(`Added ${seatConfig.length} new seats to train ${trainId}`);
      return { 
        message: 'Seat configuration updated in Redis',
        totalSeats: Object.keys(mergedConfig).length
      };
    } catch (error) {
      this.logger.error(`Error creating seats for train ${trainId}:`, error);
      throw error;
    }
  }

  async getAvailableSeats(trainId: number, date: string, time: string) {
    const scheduleKey = this.getScheduleSeatsKey(String(trainId), date, time);
    const configKey = this.getSeatConfigKey(String(trainId));
    
    // Get the base seat configuration
    const config = await this.redis.get(configKey);
    if (!config) {
      this.logger.warn(`No seat config found for train ${trainId}`);
      return [];
    }

    const seatConfig: Record<string, SeatData> = JSON.parse(config);
    
    // Check if the schedule seats hash exists
    const exists = await this.redis.exists(scheduleKey);
    if (!exists) {
      // Initialize all seats as available for this schedule
      const pipeline = this.redis.pipeline();
      Object.keys(seatConfig).forEach(seatNumber => {
        pipeline.hset(scheduleKey, seatNumber, 'available');
      });
      await pipeline.exec();
      this.logger.log(`Initialized seats for train ${trainId} schedule ${date} ${time}`);
    }

    // Get all seats and filter available ones
    const allSeats = await this.redis.hgetall(scheduleKey);
    const availableSeats = Object.entries(allSeats)
      .filter(([, status]) => status === 'available')
      .map(([seatId]) => seatId);
    return availableSeats;
  }

  async reserveSeat(trainId: string, date: string, time: string, seatId: string, userId: string): Promise<void> {
    const scheduleKey = this.getScheduleSeatsKey(trainId, date, time);
    const lockKey = this.getLockKey(trainId, date, time, seatId);

    // Get the current seat status
    const currentStatus = await this.redis.hget(scheduleKey, seatId);
    if (currentStatus !== 'available') {
      throw new Error(`Seat ${seatId} is not available`);
    }

    // Use Redis transaction to ensure atomicity
    const multi = this.redis.multi();
    multi.hset(scheduleKey, seatId, 'reserved');
    multi.set(lockKey, userId, 'EX', 300); // 5 minutes lock
    await multi.exec();
  }

  async confirmReservation(trainId: string, date: string, time: string, seatId: string, userId: string) {
    const key = this.getSeatKey(trainId, date, time);
    const lockKey = this.getLockKey(trainId, date, time, seatId);

    this.logger.debug('Confirming reservation:', {
      key,
      lockKey,
      seatId,
      userId
    });

    try {
      // Get current seat status
      const currentStatus = await this.redis.hget(key, seatId);
      this.logger.debug(`Current status for seat ${seatId}: ${currentStatus}`);

      // Verify seat is pending for this user
      if (currentStatus !== `pending:${userId}`) {
        this.logger.warn(`Cannot confirm seat ${seatId}. Current status: ${currentStatus}, Expected: pending:${userId}`);
        throw new ConflictException('Cannot confirm: seat not pending for this user');
      }

      // Use transaction to ensure atomicity
      const multi = this.redis.multi();
      multi.hset(key, seatId, 'reserved');
      multi.del(lockKey);
      
      this.logger.debug('Executing Redis transaction for seat confirmation');
      const results = await multi.exec();
      this.logger.debug('Redis transaction results:', results);

      // Verify the update
      const newStatus = await this.redis.hget(key, seatId);
      this.logger.debug(`New status for seat ${seatId}: ${newStatus}`);

      if (newStatus !== 'reserved') {
        this.logger.error(`Failed to update seat ${seatId} status to reserved. Current status: ${newStatus}`);
        throw new Error('Failed to update seat status');
      }

      this.logger.debug(`Seat ${seatId} confirmed as reserved`);
      return { message: 'Reservation confirmed' };
    } catch (error) {
      this.logger.error(`Error confirming reservation for seat ${seatId}:`, error);
      throw error;
    }
  }

  async releaseSeat(trainId: string, date: string, time: string, seatId: string, userId: string): Promise<void> {
    const scheduleKey = this.getScheduleSeatsKey(trainId, date, time);
    const lockKey = this.getLockKey(trainId, date, time, seatId);

    // Check if the seat is locked by this user
    const lockOwner = await this.redis.get(lockKey);
    if (lockOwner !== userId) {
      throw new Error('Cannot release seat: not locked by this user');
    }

    // Use Redis transaction to ensure atomicity
    const multi = this.redis.multi();
    multi.hset(scheduleKey, seatId, 'available');
    multi.del(lockKey);
    await multi.exec();
  }

  async getSeatDetails(trainId: string, date?: string, time?: string) {
    try {
      if (!this.redis) {
        this.logger.error('Redis client not initialized');
        throw new Error('Redis client not initialized');
      }

      // Get the base seat configuration
      const configKey = this.getSeatConfigKey(trainId);
      const config = await this.redis.get(configKey);
      
      if (!config) {
        this.logger.warn(`No seat config found for train ${trainId}`);
        return {};
      }

      const baseConfig: Record<string, SeatData> = JSON.parse(config);
      this.logger.debug(`Base seat config: ${JSON.stringify(baseConfig)}`);

      // If date and time are provided, get schedule-specific seat status
      if (date && time) {
        const scheduleKey = this.getScheduleSeatsKey(trainId, date, time);
        this.logger.debug(`Getting seats for schedule key: ${scheduleKey}`);
        
        // Get the schedule seats status
        const scheduleSeats = await this.redis.hgetall(scheduleKey);
        this.logger.debug(`Schedule seats status: ${JSON.stringify(scheduleSeats)}`);

        // If no schedule data exists, initialize it with all seats available
        if (Object.keys(scheduleSeats).length === 0) {
          this.logger.debug('No schedule data found, initializing with available seats');
          const pipeline = this.redis.pipeline();
          Object.keys(baseConfig).forEach(seatNumber => {
            pipeline.hset(scheduleKey, seatNumber, 'available');
          });
          await pipeline.exec();
          
          // Return base config with all seats marked as available
          return Object.entries(baseConfig).reduce((acc, [seatNumber, seatData]) => {
            acc[seatNumber] = {
              ...seatData,
              status: 'available'
            };
            return acc;
          }, {});
        }

        // Merge schedule status with base config
        return Object.entries(baseConfig).reduce((acc, [seatNumber, seatData]) => {
          acc[seatNumber] = {
            ...seatData,
            status: scheduleSeats[seatNumber] || 'available'
          };
          return acc;
        }, {});
      }

      // If no date/time provided, return base config with all seats marked as available
      return Object.entries(baseConfig).reduce((acc, [seatNumber, seatData]) => {
        acc[seatNumber] = {
          ...seatData,
          status: 'available'
        };
        return acc;
      }, {});
    } catch (error) {
      this.logger.error(`Error getting seat details for train ${trainId}:`, error);
      throw error;
    }
  }

  async deleteSeats(trainId: string, seatNumbers: string[]): Promise<void> {
    const client = this.redisService.getClient();
    const configKey = this.getSeatConfigKey(trainId);

    // Get current seat config
    const config = await client.get(configKey);
    if (!config) {
      throw new Error('No seats found for this train');
    }

    // Remove specified seats from config
    const seatConfig: Record<string, SeatData> = JSON.parse(config);
    seatNumbers.forEach(seatNumber => {
      delete seatConfig[seatNumber];
    });
    await client.set(configKey, JSON.stringify(seatConfig));

    // Remove specified seats from all schedule hashes
    const scheduleKeys = await client.keys(`train:${trainId}:schedule:*:seats`);
    for (const scheduleKey of scheduleKeys) {
      const pipeline = client.multi();
      seatNumbers.forEach(seatNumber => {
        pipeline.hdel(scheduleKey, seatNumber);
      });
      await pipeline.exec();
    }
  }

  async updateSeatPrice(trainId: string, seatNumber: string, price: number): Promise<void> {
    const client = this.redisService.getClient();
    const configKey = this.getSeatConfigKey(trainId);

    // Get current seat data
    const config = await client.get(configKey);
    if (!config) {
      throw new Error('No seats found for this train');
    }

    const seatConfig: Record<string, SeatData> = JSON.parse(config);
    if (!seatConfig[seatNumber]) {
      throw new Error('Seat not found');
    }

    // Update price in seat data
    seatConfig[seatNumber].price = price;

    // Save updated seat data
    await client.set(configKey, JSON.stringify(seatConfig));
  }
}
