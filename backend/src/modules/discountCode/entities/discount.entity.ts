import { Entity, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, UpdateDateColumn, JoinColumn} from 'typeorm';
import { User } from '../../user/entities/user.entity'

@Entity('discount-code')
export class DiscountCode{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: false,
        unique: true
    })
    code: string;

    @OneToOne(() => User, user => user.discountCode)
    @JoinColumn()
    user: User;

    @Column({
        type: 'timestamp',
        nullable: false
    })
    expireDate: Date;

    @Column({
        type: 'int',
        nullable: false,
        default: 5
    })
    discountPercentage: number;

    @Column({
        type: 'boolean',
        default: false
    })
    isUsed: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}