import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Client } from "../../entities/client.entity";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.entity";

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
    private auditService: AuditService,
  ) {}

  async create(
    userId: string,
    createClientDto: CreateClientDto,
  ): Promise<Client> {
    const client = this.clientRepository.create({
      ...createClientDto,
      userId,
    });
    const saved = await this.clientRepository.save(client);
    await this.auditService.log({
      userId,
      entityType: "client",
      entityId: saved.id,
      action: AuditAction.CREATE,
      afterState: saved,
    });
    return saved;
  }

  async findAll(userId: string, activeOnly?: boolean): Promise<Client[]> {
    const where: any = { userId };
    if (activeOnly !== undefined) {
      where.isActive = activeOnly;
    }
    return this.clientRepository.find({
      where,
      order: { name: "ASC" },
    });
  }

  async findOne(userId: string, id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id, userId },
    });

    if (!client) {
      throw new NotFoundException("Client not found");
    }

    return client;
  }

  async update(
    userId: string,
    id: string,
    updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    const client = await this.findOne(userId, id);
    const beforeState = { ...client };
    Object.assign(client, updateClientDto);
    const saved = await this.clientRepository.save(client);
    await this.auditService.log({
      userId,
      entityType: "client",
      entityId: saved.id,
      action: AuditAction.UPDATE,
      beforeState,
      afterState: saved,
    });
    return saved;
  }

  async delete(userId: string, id: string): Promise<void> {
    const client = await this.findOne(userId, id);
    const beforeState = { ...client };
    await this.clientRepository.softRemove(client);
    await this.auditService.log({
      userId,
      entityType: "client",
      entityId: id,
      action: AuditAction.DELETE,
      beforeState,
    });
  }

  async restore(userId: string, id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id, userId },
      withDeleted: true,
    });
    if (!client) {
      throw new NotFoundException("Client not found");
    }
    if (!client.deletedAt) {
      return client;
    }
    await this.clientRepository.restore({ id, userId });
    const restored = await this.findOne(userId, id);
    await this.auditService.log({
      userId,
      entityType: "client",
      entityId: id,
      action: AuditAction.RESTORE,
      beforeState: { deletedAt: client.deletedAt },
      afterState: restored,
    });
    return restored;
  }
}
