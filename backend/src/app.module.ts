import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RouteModule } from './modules/route/route.module';
import { TrainModule } from './modules/train/train.module';
import { AuthzModule } from './modules/authz/authz.module';
import { UserModule } from './modules/user/user.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { RedisModule } from './modules/redis/redis.module';
import { SeatsModule } from './modules/seats/seats.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { PaymentModule } from './modules/payment/payment.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthzModule,
    RouteModule,
    TrainModule,
    ScheduleModule,
    RedisModule,
    SeatsModule,
    ReservationModule,
    PaymentModule,
    TicketModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
