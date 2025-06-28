import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.users.findOne({ where: { auth0Id } });
  }

  async createFromAuth0(claims: {
    sub: string;
    email?: string;
    name?: string;
  }): Promise<User> {
    const email = claims.email
              ?? (claims as any)['https://lab1.com/email'];
    const name  = claims.name
              ?? (claims as any)['https://lab1.com/username'];


    const user = this.users.create({
      auth0Id: claims.sub,
      email,
      name,
    });
    return this.users.save(user);
  }

  async getAllUsers(): Promise<User[]> {
    return this.users.find({
      order: { name: 'ASC' }
    });
  }
}
