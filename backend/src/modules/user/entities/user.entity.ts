import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm';
import { Reservation } from '../../reservation/entities/reservation.entity';
import { DiscountCode } from '../../discountCode/entities/discount.entity';

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

  @OneToMany(() => Reservation, reservation => reservation.user)
  reservations: Reservation[];

  @OneToOne(() => DiscountCode, discountCode => discountCode.user)
  discountCode: DiscountCode;
}