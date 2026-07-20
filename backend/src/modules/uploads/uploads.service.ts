import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Attachment } from "../../entities/attachment.entity";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";

export interface UploadFileDto {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface CreateAttachmentDto {
  originalName: string;
  mimeType: string;
  size: number;
  description?: string;
  entityType?: string;
  entityId?: string;
  userId: string;
}

@Injectable()
export class UploadsService {
  private readonly uploadsDir: string;

  constructor(
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
  ) {
    this.uploadsDir = path.join(process.cwd(), "uploads");
    this.ensureUploadsDir();
  }

  private ensureUploadsDir(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  private generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const timestamp = Date.now();
    return `${timestamp}-${uniqueId}${ext}`;
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    entityType?: string,
    entityId?: string,
  ): Promise<Attachment> {
    const fileName = this.generateFileName(file.originalname);
    const filePath = path.join(this.uploadsDir, fileName);

    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);

    const attachment = this.attachmentRepository.create({
      originalName: file.originalname,
      fileName,
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
    const where: any = { userId };
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

  async getFile(
    id: string,
    userId: string,
  ): Promise<{ attachment: Attachment; filePath: string }> {
    const attachment = await this.findOne(id, userId);
    const filePath = path.join(this.uploadsDir, attachment.fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException("File not found on disk");
    }

    return { attachment, filePath };
  }

  async remove(id: string, userId: string): Promise<void> {
    const attachment = await this.findOne(id, userId);
    const filePath = path.join(this.uploadsDir, attachment.fileName);

    // Delete file from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.attachmentRepository.remove(attachment);
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
}
