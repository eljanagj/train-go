import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { SeatType } from './entities/seat.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('seats')
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post('train/:trainId')
  @ApiOperation({ summary: 'Create seats for a train' })
  @ApiResponse({ status: 201, description: 'Seats created successfully' })
  createSeatsForTrain(
    @Param('trainId') trainId: number,
    @Body() seatConfig: {
      seatNumber: string;
      type: SeatType;
      price: number;
      location: string;
    }[]
  ) {
    return this.seatsService.createSeatsForTrain(trainId, seatConfig);
  }

  @Get('train/:trainId/available')
  @ApiOperation({ summary: 'Get available seats for a train' })
  @ApiResponse({ status: 200, description: 'Returns list of available seats' })
  getAvailableSeats(@Param('trainId') trainId: number) {
    return this.seatsService.getAvailableSeats(trainId);
  }

  @Get('train/:trainId')
  @ApiOperation({ summary: 'Get all seats for a train' })
  @ApiResponse({ status: 200, description: 'Returns list of all seats' })
  getAllSeatsForTrain(@Param('trainId') trainId: number) {
    return this.seatsService.getAllSeatsForTrain(trainId);
  }

  @Get(':seatId')
  @ApiOperation({ summary: 'Get seat details' })
  @ApiResponse({ status: 200, description: 'Returns seat details' })
  getSeatDetails(@Param('seatId') seatId: string) {
    return this.seatsService.getSeatDetails(seatId);
  }

  @Post(':seatId/reserve')
  @ApiOperation({ summary: 'Reserve a seat' })
  @ApiResponse({ status: 200, description: 'Seat reserved successfully' })
  reserveSeat(@Param('seatId') seatId: string) {
    return this.seatsService.reserveSeat(seatId);
  }

  @Post(':seatId/release')
  @ApiOperation({ summary: 'Release a seat' })
  @ApiResponse({ status: 200, description: 'Seat released successfully' })
  releaseSeat(@Param('seatId') seatId: string) {
    return this.seatsService.releaseSeat(seatId);
  }

  @Delete(':seatId')
  @ApiOperation({ summary: 'Delete a seat' })
  @ApiResponse({ status: 200, description: 'Seat deleted successfully' })
  deleteSeat(@Param('seatId') seatId: string) {
    return this.seatsService.deleteSeat(seatId);
  }

  @Patch(':seatId')
  @ApiOperation({ summary: 'Update seat price' })
  @ApiResponse({ status: 200, description: 'Seat updated successfully' })
  updateSeatPrice(
    @Param('seatId') seatId: string,
    @Body() updateData: { price: number }
  ) {
    return this.seatsService.updateSeatPrice(seatId, updateData.price);
  }
} 