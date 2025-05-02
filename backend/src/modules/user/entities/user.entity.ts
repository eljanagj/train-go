import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  auth0Id: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  name: string;
}