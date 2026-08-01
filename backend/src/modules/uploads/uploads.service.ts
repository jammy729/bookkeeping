import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Attachment } from "../../entities/attachment.entity";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import * as crypto from "crypto";

export interface CreateAttachmentDto {
  originalName: string;
  mimeType: string;
  size: number;
  description?: string;
  entityType?: string;
  entityId?: string;
}

@Injectable()
export class UploadsService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
  ) {
    this.s3Client = new S3Client({
      forcePathStyle: true,
      region: process.env.SUPABASE_S3_REGION || "us-east-1",
      endpoint: process.env.SUPABASE_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY || "",
        secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY || "",
      },
    });
    this.bucket = process.env.SUPABASE_S3_BUCKET || "receipts";
  }

  private generateS3Key(userId: string, originalName: string): string {
    const ext = originalName.includes(".")
      ? originalName.substring(originalName.lastIndexOf("."))
      : "";
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const timestamp = Date.now();
    return `${userId}/${timestamp}-${uniqueId}${ext}`;
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    entityType?: string,
    entityId?: string,
  ): Promise<Attachment> {
    const s3Key = this.generateS3Key(userId, file.originalname);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          userId,
        },
      }),
    );

    const attachment = this.attachmentRepository.create({
      originalName: file.originalname,
      fileName: s3Key,
      mimeType: file.mimetype,
      size: file.size,
      entityType,
      entityId,
      userId,
    });

    return this.attachmentRepository.save(attachment);
  }

  async findAll(
    userId: string,
    entityType?: string,
    entityId?: string,
  ): Promise<Attachment[]> {
    const where: Record<string, any> = { userId };
    if (entityType) {
      where.entityType = entityType;
    }
    if (entityId) {
      where.entityId = entityId;
    }

    return this.attachmentRepository.find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, userId: string): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id, userId },
    });

    if (!attachment) {
      throw new NotFoundException("Attachment not found");
    }

    return attachment;
  }

  async getSignedUrl(id: string, userId: string): Promise<string> {
    const attachment = await this.findOne(id, userId);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: attachment.fileName,
      ResponseContentType: attachment.mimeType,
      ResponseContentDisposition: `inline; filename="${encodeURIComponent(attachment.originalName)}"`,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async remove(id: string, userId: string): Promise<void> {
    const attachment = await this.findOne(id, userId);

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: attachment.fileName,
      }),
    );

    await this.attachmentRepository.softRemove(attachment);
  }

  async restore(id: string, userId: string): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id, userId },
      withDeleted: true,
    });
    if (!attachment) {
      throw new NotFoundException("Attachment not found");
    }
    if (!attachment.deletedAt) {
      return attachment;
    }
    await this.attachmentRepository.restore({ id, userId });
    return this.findOne(id, userId);
  }

  async updateDescription(
    id: string,
    userId: string,
    description: string,
  ): Promise<Attachment> {
    const attachment = await this.findOne(id, userId);
    attachment.description = description;
    return this.attachmentRepository.save(attachment);
  }

  async linkToEntity(
    id: string,
    userId: string,
    entityType: string,
    entityId: string,
  ): Promise<Attachment> {
    const attachment = await this.findOne(id, userId);
    attachment.entityType = entityType;
    attachment.entityId = entityId;
    return this.attachmentRepository.save(attachment);
  }

  async unlinkFromEntity(id: string, userId: string): Promise<Attachment> {
    const attachment = await this.findOne(id, userId);
    attachment.entityType = "receipt";
    attachment.entityId = null;
    return this.attachmentRepository.save(attachment);
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: { entityType, entityId },
      order: { createdAt: "DESC" },
    });
  }

  async findReceiptsForUser(userId: string): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: { userId, entityType: "receipt" },
      order: { createdAt: "DESC" },
    });
  }
}
