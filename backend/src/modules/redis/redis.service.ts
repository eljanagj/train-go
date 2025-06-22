import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          this.logger.log(`Retrying Redis connection in ${delay}ms...`);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        connectTimeout: 10000,
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        this.logger.error('Redis connection error:', error);
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Successfully connected to Redis');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.logger.log('Redis client is ready');
      });

      this.client.on('reconnecting', () => {
        this.isConnected = false;
        this.logger.log('Reconnecting to Redis...');
      });

      // Wait for initial connection
      this.client.once('ready', () => {
        this.isConnected = true;
        this.logger.log('Initial Redis connection established');
      });
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  getClient(): Redis {
    if (!this.client) {
      this.logger.error('Redis client not initialized');
      throw new Error('Redis client not initialized');
    }
    if (!this.isConnected) {
      this.logger.warn('Redis client not connected, attempting to reconnect...');
      this.initializeRedis();
    }
    return this.client;
  }
}