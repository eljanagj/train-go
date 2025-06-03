import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
  ],
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {} 