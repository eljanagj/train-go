import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { CancellationService } from './cancellation.service';
import { CancellationStatus } from './cancellation-request.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('cancellations')
export class CancellationController {
  constructor(private readonly cancellationService: CancellationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCancellationRequest(
    @Body() body: { reservationId: string; reason: string },
  ) {
    console.log('Received cancellation request for reservation:', body.reservationId);
    return this.cancellationService.createCancellationRequest(
      body.reservationId,
      body.reason,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllCancellationRequests() {
    return this.cancellationService.getAllCancellationRequests();
  }

  @Post(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateCancellationStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: CancellationStatus;
      adminNotes?: string;
      refundAmount?: number;
    },
  ) {
    return this.cancellationService.updateCancellationStatus(
      id,
      body.status,
      'admin-id', // TODO: Get from request user
      body.adminNotes,
      body.refundAmount,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteCancellation(@Param('id') id: string) {
    return this.cancellationService.deleteCancellation(id);
  }
} 