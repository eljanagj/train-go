import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { DiscountCodeService } from './discount.service';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { UpdateDiscountCodeDto } from './dto/update-discount-code.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';

@Controller('discount-code')
export class DiscountCodeController {
    constructor(private readonly discountCodeService: DiscountCodeService) {}

    @Post()
    create(@Body() createDiscountCodeDto: CreateDiscountCodeDto) {
        return this.discountCodeService.create(createDiscountCodeDto);
    }

    @Get()
    findAll() {
        return this.discountCodeService.findAll();
    }

    @Get('user/:userId')
    getDiscountByUserId(@Param('userId') userId: string) {
        return this.discountCodeService.findByUserId(userId);
    }

    @Get('user/:userId/eligibility')
    getDiscountEligibility(@Param('userId') userId: string) {
        return this.discountCodeService.getDiscountEligibilityForUser(userId);
    }

    @Get('code/:code')
    getDiscountByCode(@Param('code') code: string) {
        return this.discountCodeService.findByCode(code);
    }

    @Get('validate/:code')
    validateDiscountCode(@Param('code') code: string) {
        return this.discountCodeService.validateDiscountCode(code);
    }

    @Post('apply')
    applyDiscount(@Body() applyDiscountDto: ApplyDiscountDto) {
        return this.discountCodeService.applyDiscount(applyDiscountDto, applyDiscountDto.userId);
    }

    @Post('check-user/:userId')
    checkAndUpdateDiscountForUser(@Param('userId') userId: string) {
        return this.discountCodeService.checkAndUpdateDiscountForUser(userId);
    }

    @Post('refresh-user/:userId')
    async refreshUserDiscount(@Param('userId') userId: string) {
        try {
            const result = await this.discountCodeService.checkAndUpdateDiscountForUser(userId);
            return {
                success: true,
                message: result ? 'Discount code updated successfully' : 'No discount code changes needed',
                discountCode: result
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                discountCode: null
            };
        }
    }

    @Patch(':id/percentage')
    updateDiscountCodePercentage(
        @Param('id') id: string,
        @Body('discountPercentage') discountPercentage: number,
    ) {
        return this.discountCodeService.updateDiscountCodePercentage(id, discountPercentage);
    }

    @Patch(':id/expire-date')
    updateDiscountCodeExpireDate(
        @Param('id') id: string,
        @Body('expireDate') expireDate: Date,
    ) {
        return this.discountCodeService.updateDiscountCodeExpireDate(id, expireDate);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateDiscountCodeDto: UpdateDiscountCodeDto,
    ) {
        return this.discountCodeService.update(id, updateDiscountCodeDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.discountCodeService.remove(id);
    }

    @Delete('expired/cleanup')
    removeExpiredCodes() {
        return this.discountCodeService.removeExpiredCodes();
    }
}