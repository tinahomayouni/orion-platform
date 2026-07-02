import { Role } from 'src/auth/enums/role.enum';
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import {Exclude} from 'class-transformer';


@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ type: 'enum', enum: Role , default: Role.USER})
  role: Role;

  @Column({ default: true })
  isActive: boolean

  @Column({ default: new Date() })
  createdAt: Date

  @Column({ default: new Date() })
  updatedAt: Date
}