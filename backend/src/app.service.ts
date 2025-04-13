import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  async testConnection(): Promise<{ status: string; message: string }> {
    try {
      // Try to connect to the database
      await this.dataSource.query('SELECT 1');
      return {
        status: 'success',
        message: 'Database connection successful!',
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Database connection failed: ${error.message}`,
      };
    }
  }
}
