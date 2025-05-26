import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus, TicketType } from './entities/ticket.entity';
import { Reservation } from '../reservation/entities/reservation.entity';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private pdfService: PdfService,
  ) {}

  async createTicket(reservationId: string, type: TicketType = TicketType.STANDARD): Promise<Ticket> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      relations: ['schedule', 'schedule.train', 'schedule.route', 'user', 'payment']
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    // Check if ticket already exists
    const existingTicket = await this.ticketRepository.findOne({
      where: { reservationId }
    });

    if (existingTicket) {
      return existingTicket;
    }

    // Generate unique ticket number
    const ticketNumber = this.generateTicketNumber();

    const ticket = this.ticketRepository.create({
      reservationId,
      ticketNumber,
      type,
      status: TicketStatus.PENDING,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    return await this.ticketRepository.save(ticket);
  }

  async generateTicketPdf(ticketId: string): Promise<Buffer> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['reservation', 'reservation.schedule', 'reservation.schedule.train', 'reservation.schedule.route', 'reservation.user']
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    if (!ticket.reservation.passengerName || !ticket.reservation.passengerSurname) {
      throw new BadRequestException('Passenger information is missing from reservation');
    }

    // Check if payment is confirmed before allowing PDF download
    if (ticket.reservation.status !== 'confirmed') {
      throw new BadRequestException('PDF ticket can only be generated for confirmed reservations');
    }

    const pdfBuffer = await this.pdfService.generateTicketPdf({
      reservation: ticket.reservation,
      ticketNumber: ticket.ticketNumber
    });

    // Update ticket status and download info
    ticket.status = TicketStatus.GENERATED;
    ticket.generatedAt = new Date();
    ticket.downloadCount += 1;
    ticket.downloadedAt = new Date();

    await this.ticketRepository.save(ticket);

    return pdfBuffer;
  }

  async findByReservationId(reservationId: string): Promise<Ticket | null> {
    return await this.ticketRepository.findOne({
      where: { reservationId },
      relations: ['reservation']
    });
  }

  async findById(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['reservation', 'reservation.schedule', 'reservation.schedule.train', 'reservation.schedule.route']
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket> {
    const ticket = await this.findById(id);
    ticket.status = status;
    return await this.ticketRepository.save(ticket);
  }

  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TKT-${timestamp}-${random}`.toUpperCase();
  }

  async getTicketsByStatus(status: TicketStatus): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { status },
      relations: ['reservation', 'reservation.schedule', 'reservation.schedule.train', 'reservation.schedule.route']
    });
  }

  async deleteExpiredTickets(): Promise<number> {
    const expiredTickets = await this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.expiresAt < :now', { now: new Date() })
      .andWhere('ticket.status = :status', { status: TicketStatus.EXPIRED })
      .getMany();

    if (expiredTickets.length > 0) {
      await this.ticketRepository.remove(expiredTickets);
    }

    return expiredTickets.length;
  }

  async findAllForAdmin(): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      relations: ['reservation', 'reservation.schedule', 'reservation.schedule.train', 'reservation.schedule.route', 'reservation.user'],
      order: { createdAt: 'DESC' }
    });
  }
}
