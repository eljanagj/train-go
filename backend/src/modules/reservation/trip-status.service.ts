import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { Schedule } from '../schedule/schedule.entity';
import { PaymentStatus } from '../payment/entities/payment.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TripStatusService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
  ) {}

  /**
   * Updates the status of a single reservation based on current time and conditions
   */
  async updateReservationStatus(reservation: Reservation): Promise<Reservation> {
    // Don't update cancelled reservations
    if (reservation.status === ReservationStatus.CANCELLED) {
      return reservation;
    }

    const schedule = await this.scheduleRepository.findOne({
      where: { id: reservation.scheduleId }
    });

    if (!schedule) {
      return reservation;
    }

    const departureTime = schedule.departureTime;
    const arrivalTime = schedule.arrivalTime;

    const [depHours, depMinutes] = departureTime.split(':').map(Number);
    const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);

    const now = new Date();
    const depTimeInMinutes = depHours * 60 + depMinutes;
    const arrTimeInMinutes = arrHours * 60 + arrMinutes;
    const nowInMinutes = now.getHours() * 60 + now.getMinutes();

    const hoursTillDeparture = (depTimeInMinutes - nowInMinutes) / 60;

    // Auto-cancel if less than 2 hours till departure and payment is not completed
    if (hoursTillDeparture < 2 && 
        (reservation.status === ReservationStatus.PAYMENT_PENDING || 
         (reservation.payment && reservation.payment.status !== PaymentStatus.COMPLETED))) {
      reservation.status = ReservationStatus.CANCELLED;
      reservation.cancellationReason = 'Automatically cancelled: Less than 2 hours before departure without completed payment';
      reservation.cancellationDate = now;
      return await this.reservationRepository.save(reservation);
    }

    // Update status based on journey progress
    if (reservation.status === ReservationStatus.CONFIRMED) {
      if (nowInMinutes >= depTimeInMinutes && nowInMinutes < arrTimeInMinutes) {
        reservation.status = ReservationStatus.IN_PROGRESS;
      } else if (nowInMinutes >= arrTimeInMinutes) {
        reservation.status = ReservationStatus.COMPLETED;
      }
    }

    // Check payment status
    if (reservation.payment) {
      if (reservation.payment.status === PaymentStatus.FAILED) {
        reservation.status = ReservationStatus.CANCELLED;
        reservation.cancellationReason = 'Payment failed';
        reservation.cancellationDate = now;
        return await this.reservationRepository.save(reservation);
      }

      if (reservation.payment.status === PaymentStatus.COMPLETED &&
          reservation.status === ReservationStatus.PAYMENT_PENDING) {
        reservation.status = ReservationStatus.CONFIRMED;
      }
    }

    return await this.reservationRepository.save(reservation);
  }

  /**
   * Updates the status of all reservations based on current time and conditions
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async updateAllReservationStatuses() {
    const now = new Date();

    // Find all active reservations that might need updates
    const activeReservations = await this.reservationRepository.find({
      where: [
        { status: ReservationStatus.CONFIRMED },
        { status: ReservationStatus.IN_PROGRESS },
        { status: ReservationStatus.PAYMENT_PENDING }
      ],
      relations: ['payment', 'schedule']
    });

    // Update each reservation's status
    await Promise.all(activeReservations.map(reservation => this.updateReservationStatus(reservation)));

    console.log(`Updated statuses for ${activeReservations.length} reservations at ${now.toISOString()}`);
  }

  /**
   * Gets all reservations with a specific status
   */
  async getReservationsByStatus(status: ReservationStatus): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: { status },
      relations: ['schedule', 'schedule.train', 'schedule.route', 'user', 'payment', 'seats']
    });
  }

  /**
   * Gets current trip statistics
   */
  async getTripStatistics() {
    const now = new Date();
    
    const [
      confirmedCount,
      paymentPendingCount,
      inProgressCount,
      completedCount,
      cancelledCount
    ] = await Promise.all([
      this.reservationRepository.count({ where: { status: ReservationStatus.CONFIRMED } }),
      this.reservationRepository.count({ where: { status: ReservationStatus.PAYMENT_PENDING } }),
      this.reservationRepository.count({ where: { status: ReservationStatus.IN_PROGRESS } }),
      this.reservationRepository.count({ where: { status: ReservationStatus.COMPLETED } }),
      this.reservationRepository.count({ where: { status: ReservationStatus.CANCELLED } })
    ]);

    return {
      confirmedCount,
      paymentPendingCount,
      inProgressCount,
      completedCount,
      cancelledCount,
      timestamp: now
    };
  }
} 