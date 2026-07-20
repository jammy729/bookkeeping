import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadsService } from "./uploads.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { Response } from "express";

@ApiTags("Uploads")
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
        file: {
          type: "string",
          format: "binary",
        },
        entityType: {
          type: "string",
          description: "Entity type (expense, invoice, etc.)",
        },
        entityId: {
          type: "string",
          description: "Entity ID",
        },
        userId: {
          type: "string",
          description: "User ID",
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: "File uploaded successfully" })
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query("userId") userId: string,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
  ) {
    return this.uploadsService.uploadFile(file, userId, entityType, entityId);
  }

  @Get()
  @ApiOperation({ summary: "List all attachments" })
  @ApiResponse({ status: 200, description: "List of attachments" })
  async findAll(
    @Query("userId") userId: string,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
  ) {
    return this.uploadsService.findAll(userId, entityType, entityId);
  }

  @Get(":id/download")
  @ApiOperation({ summary: "Download a file" })
  @ApiResponse({ status: 200, description: "File downloaded" })
  @ApiResponse({ status: 404, description: "File not found" })
  async download(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("userId") userId: string,
    @Res() res: Response,
  ) {
    const { attachment, filePath } = await this.uploadsService.getFile(
      id,
      userId,
    );
    res.download(filePath, attachment.originalName);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get attachment metadata" })
  @ApiResponse({ status: 200, description: "Attachment metadata" })
  @ApiResponse({ status: 404, description: "Attachment not found" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("userId") userId: string,
  ) {
    return this.uploadsService.findOne(id, userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an attachment" })
  @ApiResponse({ status: 200, description: "Attachment deleted" })
  @ApiResponse({ status: 404, description: "Attachment not found" })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("userId") userId: string,
  ) {
    await this.uploadsService.remove(id, userId);
    return { message: "Attachment deleted successfully" };
  }
}
