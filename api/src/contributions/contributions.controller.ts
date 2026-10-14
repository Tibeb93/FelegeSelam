import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Res,
  StreamableFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { ContributionsService } from './contributions.service';
import {
  CreateContributionDto,
  UpdateContributionDto,
  QueryContributionDto,
  ExportContributionDto,
} from './dto/contribution.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators/auth.decorator';

@ApiTags('Contributions & Finance')
@Controller('contributions')
@UseGuards(RolesGuard)
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'Record a new member contribution with automatic receipt number generation',
  })
  @ApiResponse({ status: 201, description: 'Contribution recorded successfully' })
  async create(@Body() dto: CreateContributionDto, @CurrentUser('id') userId?: string) {
    return this.contributionsService.createContribution(dto, userId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'List contributions with filters, search, and pagination',
  })
  async findAll(@Query() query: QueryContributionDto) {
    return this.contributionsService.findAll(query);
  }

  @Get('summary')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'School-wide contribution summary with type breakdown and monthly trends',
  })
  async getSchoolSummary(@Query() query: QueryContributionDto) {
    return this.contributionsService.getSchoolSummary(query);
  }

  @Get('export')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'Export filtered contributions to styled Excel (.xlsx)',
  })
  async exportToExcel(
    @Query() query: ExportContributionDto,
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (query.format !== 'xlsx') {
      throw new BadRequestException('Format must be "xlsx"');
    }

    const { buffer, filename } = await this.contributionsService.exportToExcel(query, userId);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Get('members/:memberId/summary')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'member')
  @ApiParam({ name: 'memberId', description: 'Member UUID' })
  @ApiOperation({
    summary: 'Monthly contribution summary and history for a specific member',
  })
  async getMemberSummary(@Param('memberId', ParseUUIDPipe) memberId: string) {
    return this.contributionsService.getMemberSummary(memberId);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'member')
  @ApiParam({ name: 'id', description: 'Contribution UUID' })
  @ApiOperation({ summary: 'Get single contribution details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contributionsService.findOne(id);
  }

  @Get(':id/receipt')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'member')
  @ApiParam({ name: 'id', description: 'Contribution UUID' })
  @ApiOperation({
    summary: 'Download official branded PDF receipt voucher with QR code and Ethiopian details',
  })
  async getReceiptPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.contributionsService.generateReceiptPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Contribution UUID' })
  @ApiOperation({ summary: 'Update contribution details' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContributionDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.contributionsService.update(id, dto, userId);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Contribution UUID' })
  @ApiOperation({ summary: 'Partially update contribution details' })
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContributionDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.contributionsService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Contribution UUID' })
  @ApiOperation({ summary: 'Delete a contribution record' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId?: string) {
    return this.contributionsService.delete(id, userId);
  }
}
