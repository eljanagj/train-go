import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SeatsService, SeatData } from './seats.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('seats')
@Controller('seats')
@UseGuards(JwtAuthGuard)
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post('train/:trainId')
  @ApiOperation({ summary: 'Set seat configuration for a train' })
  @ApiResponse({ status: 201, description: 'Seat configuration set successfully' })
  createSeatsForTrain(
    @Param('trainId') trainId: string,
    @Body()
    seatConfig: {
      seatNumber: string;
      type: string;
      class: string;
      price: number;
      location: string;
      row: number;
      position: string;
    }[],
  ) {
    return this.seatsService.createSeatsForTrain(parseInt(trainId), seatConfig);
  }

  @Get('train/:trainId')
  @ApiOperation({ summary: 'Get all seats for a train' })
  @ApiResponse({ status: 200, description: 'Returns all seats for the train' })
  getAllSeatsForTrain(
    @Param('trainId') trainId: string,
    @Query('date') date?: string,
    @Query('time') time?: string
  ): Promise<Record<string, SeatData>> {
    return this.seatsService.getSeatDetails(trainId, date, time);
  }

  @Get(':trainId/:date/:time/available')
  @ApiOperation({ summary: 'Get available seats for a train schedule' })
  @ApiResponse({ status: 200, description: 'List of available seats' })
  getAvailableSeats(
    @Param('trainId') trainId: string,
    @Param('date') date: string, // Format: YYYY-MM-DD
    @Param('time') time: string, // Format: HH:mm
  ) {
    return this.seatsService.getAvailableSeats(parseInt(trainId), date, time);
  }

  @Post(':trainId/:date/:time/:seatId/reserve/:userId')
  @ApiOperation({ summary: 'Reserve a seat temporarily' })
  @ApiResponse({ status: 200, description: 'Seat marked as pending for user' })
  reserveSeat(
    @Param('trainId') trainId: string,
    @Param('date') date: string,
    @Param('time') time: string,
    @Param('seatId') seatId: string,
    @Param('userId') userId: string,
  ) {
    return this.seatsService.reserveSeat(trainId, date, time, seatId, userId);
  }

  @Post(':trainId/:date/:time/:seatId/release/:userId')
  @ApiOperation({ summary: 'Release a pending reservation' })
  @ApiResponse({ status: 200, description: 'Seat released successfully' })
  releaseSeat(
    @Param('trainId') trainId: string,
    @Param('date') date: string,
    @Param('time') time: string,
    @Param('seatId') seatId: string,
    @Param('userId') userId: string,
  ) {
    return this.seatsService.releaseSeat(trainId, date, time, seatId, userId);
  }

  @Delete('train/:trainId')
  async deleteSeats(
    @Param('trainId') trainId: string,
    @Body() body: { seatNumbers: string[] }
  ) {
    return this.seatsService.deleteSeats(trainId, body.seatNumbers);
  }

  @Patch('train/:trainId/:seatNumber/price')
  @ApiOperation({ summary: 'Update seat price' })
  @ApiResponse({ status: 200, description: 'Seat price updated successfully' })
  updateSeatPrice(
    @Param('trainId') trainId: string,
    @Param('seatNumber') seatNumber: string,
    @Body() body: { price: number }
  ) {
    return this.seatsService.updateSeatPrice(trainId, seatNumber, body.price);
  }
}
