import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

    async findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
        where: { id },
    });

    if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
    }

    async createUser(user: CreateUserDto): Promise<User> {
        return this.userRepository.save(user);
    }
}