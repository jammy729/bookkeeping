import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../entities/client.entity';

export interface CreateClientDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async create(userId: string, createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clientRepository.create({
      ...createClientDto,
      userId,
    });
    return this.clientRepository.save(client);
  }

  async findAll(userId: string, activeOnly?: boolean): Promise<Client[]> {
    const where: any = { userId };
    if (activeOnly !== undefined) {
      where.isActive = activeOnly;
    }
    return this.clientRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id, userId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(userId: string, id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(userId, id);
    Object.assign(client, updateClientDto);
    return this.clientRepository.save(client);
  }

  async delete(userId: string, id: string): Promise<void> {
    const client = await this.findOne(userId, id);
    await this.clientRepository.remove(client);
  }
}
