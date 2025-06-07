import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscountCode } from './entities/discount.entity';
import { User } from '../user/entities/user.entity';
import { Reservation, ReservationStatus } from '../reservation/entities/reservation.entity';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { UpdateDiscountCodeDto } from './dto/update-discount-code.dto';
import { ApplyDiscountDto, DiscountApplicationResult } from './dto/apply-discount.dto';

@Injectable()
export class DiscountCodeService {
    constructor(
        @InjectRepository(DiscountCode)
        private discountCodeRepository: Repository<DiscountCode>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Reservation)
        private reservationRepository: Repository<Reservation>,
    ) {}

    async create(createDiscountCodeDto: CreateDiscountCodeDto): Promise<DiscountCode> {
        const user = await this.userRepository.findOne({
            where: { id: createDiscountCodeDto.userId },
            relations: ['discountCode']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.discountCode) {
            throw new ConflictException('User already has a discount code');
        }

        const discountCode = this.discountCodeRepository.create({
            code: this.generateDiscountCode(),
            user: user,
            discountPercentage: createDiscountCodeDto.discountPercentage,
            expireDate: createDiscountCodeDto.expireDate,
        });

        return await this.discountCodeRepository.save(discountCode);
    }

    async findAll(): Promise<DiscountCode[]> {
        return await this.discountCodeRepository.find({
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });
    }

    async findByUserId(userId: string): Promise<DiscountCode | null> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['discountCode']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user.discountCode || null;
    }

    async findByCode(code: string): Promise<DiscountCode> {
        const discountCode = await this.discountCodeRepository.findOne({
            where: { code },
            relations: ['user']
        });

        if (!discountCode) {
            throw new NotFoundException('Discount code not found');
        }

        return discountCode;
    }

    async updateDiscountCodePercentage(id: string, discountPercentage: number): Promise<DiscountCode> {
        const discountCode = await this.discountCodeRepository.findOne({
            where: { id },
            relations: ['user']
        });

        if (!discountCode) {
            throw new NotFoundException('Discount code not found');
        }

        if (discountPercentage < 1 || discountPercentage > 30) {
            throw new BadRequestException('Discount percentage must be between 1 and 30');
        }

        discountCode.discountPercentage = discountPercentage;
        return await this.discountCodeRepository.save(discountCode);
    }

    async updateDiscountCodeExpireDate(id: string, expireDate: Date): Promise<DiscountCode> {
        const discountCode = await this.discountCodeRepository.findOne({
            where: { id },
            relations: ['user']
        });

        if (!discountCode) {
            throw new NotFoundException('Discount code not found');
        }

        discountCode.expireDate = expireDate;
        return await this.discountCodeRepository.save(discountCode);
    }

    async update(id: string, updateDiscountCodeDto: UpdateDiscountCodeDto): Promise<DiscountCode> {
        const discountCode = await this.discountCodeRepository.findOne({
            where: { id },
            relations: ['user']
        });

        if (!discountCode) {
            throw new NotFoundException('Discount code not found');
        }

        Object.assign(discountCode, updateDiscountCodeDto);
        return await this.discountCodeRepository.save(discountCode);
    }

    async remove(id: string): Promise<void> {
        const discountCode = await this.discountCodeRepository.findOne({
            where: { id }
        });

        if (!discountCode) {
            throw new NotFoundException('Discount code not found');
        }

        await this.discountCodeRepository.remove(discountCode);
    }

    async removeExpiredCodes(): Promise<number> {
        const expiredCodes = await this.discountCodeRepository
            .createQueryBuilder('discount')
            .where('discount.expireDate < :now', { now: new Date() })
            .getMany();

        if (expiredCodes.length > 0) {
            await this.discountCodeRepository.remove(expiredCodes);
        }

        return expiredCodes.length;
    }

    async validateDiscountCode(code: string): Promise<{ isValid: boolean; discountCode?: DiscountCode; message?: string }> {
        try {
            const discountCode = await this.findByCode(code);
            
            if (discountCode.isUsed) {
                return { isValid: false, message: 'Discount code has already been used' };
            }

            if (new Date() > discountCode.expireDate) {
                return { isValid: false, message: 'Discount code has expired' };
            }

            return { isValid: true, discountCode };
        } catch (error) {
            return { isValid: false, message: 'Invalid discount code' };
        }
    }

    async useDiscountCode(code: string): Promise<DiscountCode> {
        const validation = await this.validateDiscountCode(code);
        
        if (!validation.isValid) {
            throw new BadRequestException(validation.message);
        }

        const discountCode = validation.discountCode!;
        discountCode.isUsed = true;
        return await this.discountCodeRepository.save(discountCode);
    }

    // Auto-generate or update discount codes based on reservation count
    async checkAndUpdateDiscountForUser(userId: string): Promise<DiscountCode | null> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['discountCode', 'reservations']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Count confirmed reservations
        const confirmedReservations = await this.reservationRepository.count({
            where: { 
                userId: userId,
                status: ReservationStatus.CONFIRMED
            }
        });

        const discountPercentage = this.calculateDiscountPercentage(confirmedReservations);
        
        if (discountPercentage === 0) {
            return null; // Not eligible for discount
        }

        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + 6); // 6 months from now

        if (user.discountCode) {
            // Update existing discount code if percentage increased
            if (discountPercentage > user.discountCode.discountPercentage) {
                user.discountCode.discountPercentage = discountPercentage;
                user.discountCode.expireDate = expireDate;
                user.discountCode.isUsed = false; // Reset usage if upgraded
                return await this.discountCodeRepository.save(user.discountCode);
            }
            return user.discountCode;
        } else {
            // Create new discount code
            const newDiscountCode = this.discountCodeRepository.create({
                code: this.generateDiscountCode(),
                user: user,
                discountPercentage,
                expireDate,
            });
            return await this.discountCodeRepository.save(newDiscountCode);
        }
    }

    private calculateDiscountPercentage(reservationCount: number): number {
        if (reservationCount >= 20) return 30;
        if (reservationCount >= 15) return 25;
        if (reservationCount >= 10) return 20;
        if (reservationCount >= 8) return 15;
        if (reservationCount >= 5) return 10;
        if (reservationCount >= 3) return 5;
        return 0;
    }

    private generateDiscountCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'DISCOUNT-';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async applyDiscount(applyDiscountDto: ApplyDiscountDto): Promise<DiscountApplicationResult> {
        const validation = await this.validateDiscountCode(applyDiscountDto.discountCode);
        
        if (!validation.isValid) {
            return {
                isValid: false,
                message: validation.message
            };
        }

        const discountCode = validation.discountCode!;
        const discountAmount = (applyDiscountDto.originalPrice * discountCode.discountPercentage) / 100;
        const discountedPrice = applyDiscountDto.originalPrice - discountAmount;

        return {
            isValid: true,
            discountedPrice: Math.round(discountedPrice * 100) / 100, // Round to 2 decimal places
            discountAmount: Math.round(discountAmount * 100) / 100,
            discountPercentage: discountCode.discountPercentage,
            message: `${discountCode.discountPercentage}% discount applied`
        };
    }

    async getDiscountEligibilityForUser(userId: string): Promise<{
        isEligible: boolean;
        currentReservationCount: number;
        nextDiscountAt: number;
        currentDiscountPercentage: number;
        nextDiscountPercentage: number;
    }> {
        const confirmedReservations = await this.reservationRepository.count({
            where: { 
                userId: userId,
                status: ReservationStatus.CONFIRMED
            }
        });

        const currentDiscountPercentage = this.calculateDiscountPercentage(confirmedReservations);
        const nextDiscountPercentage = this.calculateDiscountPercentage(confirmedReservations + 1);
        
        let nextDiscountAt = 0;
        if (confirmedReservations < 3) nextDiscountAt = 3;
        else if (confirmedReservations < 5) nextDiscountAt = 5;
        else if (confirmedReservations < 8) nextDiscountAt = 8;
        else if (confirmedReservations < 10) nextDiscountAt = 10;
        else if (confirmedReservations < 15) nextDiscountAt = 15;
        else if (confirmedReservations < 20) nextDiscountAt = 20;

        return {
            isEligible: currentDiscountPercentage > 0,
            currentReservationCount: confirmedReservations,
            nextDiscountAt,
            currentDiscountPercentage,
            nextDiscountPercentage
        };
    }
}