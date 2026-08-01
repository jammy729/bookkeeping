import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadsService } from "./uploads.service";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";

@ApiTags("Uploads")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiOperation({ summary: "Upload a file" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        entityType: {
          type: "string",
          description: "Entity type (receipt, expense, invoice)",
        },
        entityId: { type: "string", description: "Entity ID" },
      },
    },
  })
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "File type not allowed. Accepted: JPEG, PNG, WebP, HEIC, PDF",
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException("File size exceeds 10MB limit");
    }

    return this.uploadsService.uploadFile(
      file,
      req.user.userId,
      entityType || "receipt",
      entityId,
    );
  }

  @Get()
  @ApiOperation({ summary: "List all attachments" })
  async findAll(
    @Request() req,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
  ) {
    return this.uploadsService.findAll(req.user.userId, entityType, entityId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get attachment metadata" })
  async findOne(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    return this.uploadsService.findOne(id, req.user.userId);
  }

  @Get(":id/url")
  @ApiOperation({ summary: "Get presigned download URL" })
  async getUrl(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    const url = await this.uploadsService.getSignedUrl(id, req.user.userId);
    return { url };
  }

  @Put(":id/link")
  @ApiOperation({ summary: "Link attachment to an entity" })
  async linkToEntity(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req,
    @Body() body: { entityType: string; entityId: string },
  ) {
    return this.uploadsService.linkToEntity(
      id,
      req.user.userId,
      body.entityType,
      body.entityId,
    );
  }

  @Put(":id/unlink")
  @ApiOperation({ summary: "Unlink attachment from entity" })
  async unlinkFromEntity(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    return this.uploadsService.unlinkFromEntity(id, req.user.userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft delete an attachment" })
  async remove(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    await this.uploadsService.remove(id, req.user.userId);
    return { message: "Attachment deleted successfully" };
  }

  @Post(":id/restore")
  @ApiOperation({ summary: "Restore soft-deleted attachment" })
  async restore(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    return this.uploadsService.restore(id, req.user.userId);
  }
}
