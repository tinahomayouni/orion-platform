import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';

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

    async findByEmail(email: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }
        return user;
    }

    async updateUser(id: string, user: UpdateUserDto): Promise<User> {
        const updatedUser = await this.userRepository.update(id, user);
        if (updatedUser.affected === 0) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return this.findOne(id);
    }
    
    async createUser(user: CreateUserDto): Promise<User> {
        const newUser = this.userRepository.create(user);
        return this.userRepository.save(newUser);
    }

    async setHashedRefreshToken(userId: string, hashedRefreshToken: string | null): Promise<void> {
        await this.userRepository.update({ id: userId }, { hashedRefreshToken });
    }

    async getHashedRefreshToken(userId: string): Promise<string | null> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        return user?.hashedRefreshToken || null;
    }
}