import { Controller, Get, Post, Param, Res, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { TicketStatus, TicketType } from './entities/ticket.entity';

@ApiTags('tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('reservation/:reservationId')
  @ApiOperation({ summary: 'Create a ticket for a reservation' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  async createTicket(
    @Param('reservationId') reservationId: string,
    @Query('type') type?: TicketType
  ) {
    return this.ticketService.createTicket(reservationId, type || TicketType.STANDARD);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Returns the ticket' })
  async findById(@Param('id') id: string) {
    return this.ticketService.findById(id);
  }

  @Get('reservation/:reservationId')
  @ApiOperation({ summary: 'Get ticket by reservation ID' })
  @ApiResponse({ status: 200, description: 'Returns the ticket for the reservation' })
  async findByReservationId(@Param('reservationId') reservationId: string) {
    return this.ticketService.findByReservationId(reservationId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download ticket PDF' })
  @ApiResponse({ status: 200, description: 'PDF ticket downloaded successfully' })
  async downloadTicket(
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      console.log('Generating PDF ticket for ticket ID:', id);

      const pdfBuffer = await this.ticketService.generateTicketPdf(id);
      const ticket = await this.ticketService.findById(id);

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

  @Get('status/:status')
  @ApiOperation({ summary: 'Get tickets by status' })
  @ApiResponse({ status: 200, description: 'Returns tickets with the specified status' })
  async getTicketsByStatus(@Param('status') status: TicketStatus) {
    return this.ticketService.getTicketsByStatus(status);
  }

  @Post('cleanup/expired')
  @ApiOperation({ summary: 'Delete expired tickets' })
  @ApiResponse({ status: 200, description: 'Returns number of deleted tickets' })
  async deleteExpiredTickets() {
    const deletedCount = await this.ticketService.deleteExpiredTickets();
    return { deletedCount };
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Get all tickets for admin' })
  @ApiResponse({ status: 200, description: 'Returns list of all tickets with reservation details' })
  async getAllTicketsForAdmin() {
    return this.ticketService.findAllForAdmin();
  }
}
