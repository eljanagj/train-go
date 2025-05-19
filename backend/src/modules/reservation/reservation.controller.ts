import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { ReservationService, ReservationWithSeat } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({ status: 201, description: 'Reservation created successfully' })
  create(@Body() createReservationDto: CreateReservationDto, @Request() req): Promise<ReservationWithSeat> {
    return this.reservationService.create(createReservationDto, '123e4567-e89b-12d3-a456-426614174000');
  }

  @Get()
  @ApiOperation({ summary: 'Get all reservations for the current user' })
  @ApiResponse({ status: 200, description: 'Returns list of reservations' })
  findAll(@Request() req): Promise<ReservationWithSeat[]> {
    return this.reservationService.findAll('123e4567-e89b-12d3-a456-426614174000');
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
  findOne(@Param('id') id: string, @Request() req): Promise<ReservationWithSeat> {
    return this.reservationService.findOne(id, '123e4567-e89b-12d3-a456-426614174000');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation updated successfully' })
  update(@Param('id') id: string, @Body() updateReservationDto: UpdateReservationDto, @Request() req): Promise<ReservationWithSeat> {
    return this.reservationService.update(id, updateReservationDto, '123e4567-e89b-12d3-a456-426614174000');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation deleted successfully' })
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.reservationService.remove(id, '123e4567-e89b-12d3-a456-426614174000');
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled successfully' })
  cancelReservation(@Param('id') id: string, @Request() req): Promise<ReservationWithSeat> {
    return this.reservationService.cancelReservation(id, '123e4567-e89b-12d3-a456-426614174000');
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation confirmed successfully' })
  confirmReservation(@Param('id') id: string, @Request() req): Promise<ReservationWithSeat> {
    return this.reservationService.confirmReservation(id, '123e4567-e89b-12d3-a456-426614174000');
  }
} 