import { Injectable } from '@nestjs/common';
import { DiscountCodeService } from './discount.service';
import { ReservationStatus } from '../reservation/entities/reservation.entity';

@Injectable()
export class DiscountAutomationService {
    constructor(private readonly discountCodeService: DiscountCodeService) {}

    /**
     * Called when a reservation is confirmed
     * Checks if user should get a new discount code or upgrade existing one
     */
    async handleReservationConfirmed(userId: string): Promise<void> {
        try {
            await this.discountCodeService.checkAndUpdateDiscountForUser(userId);
        } catch (error) {
            console.error('Error updating discount code for user:', error);
            // Don't throw error to avoid breaking reservation flow
        }
    }

    /**
     * Scheduled task to clean up expired discount codes
     * This should be called by a cron job
     */
    async cleanupExpiredCodes(): Promise<number> {
        return await this.discountCodeService.removeExpiredCodes();
    }
} 