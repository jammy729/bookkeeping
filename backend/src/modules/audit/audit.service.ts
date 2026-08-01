import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog, AuditAction } from "./audit.entity";

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(params: {
    userId: string;
    entityType: string;
    entityId: string;
    action: AuditAction;
    beforeState?: Record<string, any>;
    afterState?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const entry = this.auditRepository.create({
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      beforeState: params.beforeState || null,
      afterState: params.afterState || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    });
    return this.auditRepository.save(entry);
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    limit = 50,
  ): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { entityType, entityId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  async findByUser(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }
}
