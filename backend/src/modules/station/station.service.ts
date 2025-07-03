import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Station } from './entities/station.entity';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';

@Injectable()
export class StationService {
  private readonly logger = new Logger(StationService.name);

  constructor(
    @InjectRepository(Station)
    private readonly stationRepo: Repository<Station>,
  ) {}

  async create(dto: CreateStationDto): Promise<Station> {
    const station = this.stationRepo.create({
      ...dto,
      status: dto.status || 'ACTIVE',
    });
    return this.stationRepo.save(station);
  }

  async findAll(): Promise<Station[]> {
    return this.stationRepo.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<Station> {
    const station = await this.stationRepo.findOne({
      where: { stationID: id },
    });
    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }
    return station;
  }

  async update(id: number, dto: UpdateStationDto): Promise<Station> {
    const station = await this.findOne(id);
    await this.stationRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const station = await this.findOne(id);

    // For now, allow deletion of any station
    // In the future, you can add route checking logic here
    const result = await this.stationRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }
  }

  async updateStatus(id: number, status: string): Promise<Station> {
    const station = await this.findOne(id);
    station.status = status;
    return this.stationRepo.save(station);
  }

  async findActiveStations(): Promise<Station[]> {
    return this.stationRepo.find({
      where: { status: 'ACTIVE' },
      order: {
        name: 'ASC',
      },
    });
  }

  async searchStations(query: string): Promise<Station[]> {
    return this.stationRepo
      .createQueryBuilder('station')
      .where('station.name LIKE :query OR station.location LIKE :query', {
        query: `%${query}%`,
      })
      .andWhere('station.status = :status', { status: 'ACTIVE' })
      .orderBy('station.name', 'ASC')
      .getMany();
  }
}
