import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { CancellationService } from './cancellation.service';
import { CancellationStatus } from './cancellation-request.entity';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('cancellations')
export class CancellationController {
  constructor(private readonly cancellationService: CancellationService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  async getAllCancellationRequests() {
    return this.cancellationService.getAllCancellationRequests();
  }

  @Post(':id/status')
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  async deleteCancellation(@Param('id') id: string) {
    return this.cancellationService.deleteCancellation(id);
  }
} 