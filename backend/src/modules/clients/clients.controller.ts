import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ClientsService, CreateClientDto, UpdateClientDto } from './clients.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({ status: 200, description: 'List of clients' })
  async findAll(
    @Request() req,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const active = activeOnly === undefined ? undefined : activeOnly === 'true';
    return this.clientsService.findAll(req.user.userId, active);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  async create(@Request() req, @Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(req.user.userId, createClientDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific client' })
  @ApiResponse({ status: 200, description: 'Client details' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.clientsService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(req.user.userId, id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.clientsService.delete(req.user.userId, id);
  }
}
