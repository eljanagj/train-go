import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query } from '@nestjs/common';
import { ReservationService, ReservationWithSeat } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TicketService } from '../ticket/ticket.service';
import { Response } from 'express';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly ticketService: TicketService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({ status: 201, description: 'Reservation created successfully' })
  create(@Body() createReservationDto: CreateReservationDto): Promise<ReservationWithSeat> {
    return this.reservationService.create(createReservationDto);
  }

  @Post(':id/update-payment')
  @ApiOperation({ summary: 'Update payment status for a reservation' })
  @ApiResponse({ status: 200, description: 'Payment status updated successfully' })
  async updatePayment(
    @Param('id') id: string,
    @Body() body: { paymentIntentId: string }
  ): Promise<ReservationWithSeat> {
    console.log('Updating payment status for reservation:', {
      reservationId: id,
      paymentIntentId: body.paymentIntentId
    });

    try {
      const result = await this.reservationService.updatePaymentStatus(id, body.paymentIntentId);
      console.log('Payment status updated successfully:', {
        reservationId: id,
        newStatus: result.status,
        paymentStatus: result.payment?.status
      });
      return result;
    } catch (error) {
      console.error('Failed to update payment status:', {
        reservationId: id,
        paymentIntentId: body.paymentIntentId,
        error: error.message
      });
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all reservations' })
  @ApiResponse({ status: 200, description: 'Returns list of reservations' })
  findAll(): Promise<ReservationWithSeat[]> {
    return this.reservationService.findAll();
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Get all reservations for admin with full details' })
  @ApiResponse({ status: 200, description: 'Returns list of all reservations with full details' })
  findAllForAdmin(): Promise<ReservationWithSeat[]> {
    return this.reservationService.findAllForAdmin();
  }

  @Get('schedule/:id')
  @ApiOperation({ summary: 'Get reservations by schedule ID' })
  @ApiResponse({ status: 200, description: 'Returns list of reservations for the schedule' })
  findBySchedule(@Param('id') id: string): Promise<ReservationWithSeat[]> {
    return this.reservationService.findBySchedule(+id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reservation by ID' })
  @ApiResponse({ status: 200, description: 'Returns the reservation' })
  findOne(@Param('id') id: string): Promise<ReservationWithSeat> {
    return this.reservationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation updated successfully' })
  update(@Param('id') id: string, @Body() updateReservationDto: UpdateReservationDto): Promise<ReservationWithSeat> {
    return this.reservationService.update(id, updateReservationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation deleted successfully' })
  remove(@Param('id') id: string): Promise<void> {
    return this.reservationService.remove(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled successfully' })
  cancelReservation(@Param('id') id: string): Promise<ReservationWithSeat> {
    return this.reservationService.cancelReservation(id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation confirmed successfully' })
  confirmReservation(@Param('id') id: string): Promise<ReservationWithSeat> {
    return this.reservationService.confirmReservation(id);
  }

  @Get(':id/download-ticket')
  @ApiOperation({ summary: 'Download ticket PDF for a reservation' })
  @ApiResponse({ status: 200, description: 'PDF ticket downloaded successfully' })
  async downloadTicket(
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      console.log('Generating PDF ticket for reservation:', {
        reservationId: id
      });

      const reservation = await this.reservationService.findOne(id);

      // Check if reservation has passenger information
      if (!reservation.passengerName || !reservation.passengerSurname) {
        res.status(400).json({
          message: 'Passenger information is missing from reservation'
        });
        return;
      }

      // Check if payment is confirmed before allowing PDF download
      if (reservation.status !== 'confirmed' || !reservation.payment || reservation.payment.status !== 'completed') {
        res.status(403).json({
          message: 'PDF ticket can only be downloaded for confirmed reservations with completed payments',
          currentStatus: reservation.status,
          paymentStatus: reservation.payment?.status
        });
        return;
      }

      // Create or get ticket for this reservation
      let ticket = await this.ticketService.findByReservationId(id);
      if (!ticket) {
        ticket = await this.ticketService.createTicket(id);
      }

      const pdfBuffer = await this.ticketService.generateTicketPdf(ticket.id);
      const filename = `train-ticket-${ticket.ticketNumber}.pdf`;

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF ticket:', error);
      res.status(500).json({
        message: 'Failed to generate ticket PDF',
        error: error.message
      });
    }
  }
}