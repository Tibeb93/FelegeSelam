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
  UseInterceptors,
  UploadedFile,
  Res,
  ParseUUIDPipe,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto, ExportMemberQueryDto, ExportFormat } from './dto/query-member.dto';
import { GenerateLetterDto } from './dto/letter-member.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators/auth.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Members')
@ApiBearerAuth('JWT-auth')
@Controller('members')
@UseGuards(RolesGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Create a new member (admin only)' })
  @ApiResponse({ status: 201, description: 'Member created successfully' })
  @ApiResponse({ status: 409, description: 'Phone or email conflict' })
  async create(@Body() dto: CreateMemberDto, @CurrentUser('id') userId?: string) {
    return this.membersService.create(dto, userId);
  }

  @Get()
  @Roles('super_admin', 'admin', 'teacher')
  @ApiOperation({ summary: 'List members with search, filters, sorting & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of members' })
  async findAll(@Query() query: QueryMemberDto) {
    return this.membersService.findAll(query);
  }

  @Get('search')
  @Roles('super_admin', 'admin', 'teacher')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({
    summary: 'Lightweight search by name (Amharic or English) or member ID (max 20)',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search term (name or member ID)' })
  @ApiResponse({
    status: 200,
    description: 'List of matching members (id, memberNo, fullName, photo, department, status)',
  })
  async search(@Query('q') query: string) {
    return this.membersService.searchLightweight(query);
  }

  @Get('template')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Download Excel template for bulk members import' })
  @ApiResponse({ status: 200, description: 'Excel template file (.xlsx)' })
  async downloadTemplate(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const buffer = await this.membersService.getImportTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Aemade_Selam_Members_Template.xlsx"',
    });
    return new StreamableFile(buffer);
  }

  @Post('import')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Bulk import members from Excel (.xlsx) file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importMembers(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId?: string,
  ) {
    return this.membersService.importExcel(file.buffer, userId);
  }

  @Get('export')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiOperation({ summary: 'Export members list to PDF, Word, or Excel' })
  @ApiQuery({ name: 'format', enum: ExportFormat, required: false })
  async exportList(
    @Query() query: ExportMemberQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const format = query.format || ExportFormat.XLSX;
    const { buffer, mimeType, filename } = await this.membersService.exportMembersList(
      query,
      format,
    );
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Get('departments')
  @Roles('super_admin', 'admin', 'teacher', 'member')
  @ApiOperation({ summary: 'List all school departments' })
  @ApiResponse({ status: 200, description: 'List of departments' })
  async getDepartments() {
    return this.membersService.getDepartments();
  }

  @Get('me/profile')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiOperation({ summary: 'Get current logged-in member full profile' })
  async getMyProfile(@CurrentUser() user: any) {
    return this.membersService.findMyProfile(user);
  }

  @Put('me/profile')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiOperation({ summary: 'Update current logged-in member profile' })
  async updateMyProfile(@CurrentUser() user: any, @Body() dto: UpdateMemberDto) {
    return this.membersService.updateMyProfile(user, dto);
  }

  @Get('me/data-export')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiOperation({
    summary: 'Export all personal data belonging to current member (GDPR data safety)',
  })
  async exportMyData(@CurrentUser() user: any) {
    return this.membersService.exportMyData(user);
  }

  @Delete('me/account')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiOperation({
    summary: 'Deactivate own account and soft-delete member record (GDPR data safety)',
  })
  async deleteMyAccount(@CurrentUser() user: any) {
    return this.membersService.deleteMyAccount(user);
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'teacher', 'member')
  @ApiParam({ name: 'id', description: 'Member UUID' })
  @ApiOperation({ summary: 'Get member details by ID' })
  @ApiResponse({ status: 200, description: 'Member details' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Member UUID' })
  @ApiOperation({ summary: 'Update member information' })
  @ApiResponse({ status: 200, description: 'Member updated successfully' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMemberDto) {
    return this.membersService.update(id, dto);
  }

  @Patch(':id/approve')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Member UUID' })
  @ApiOperation({ summary: 'Approve pending member to active status' })
  @ApiResponse({ status: 200, description: 'Member approved' })
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.approveMember(id);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Member UUID' })
  @ApiOperation({ summary: 'Soft delete member' })
  @ApiResponse({ status: 200, description: 'Member soft-deleted' })
  async softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.softDelete(id);
  }

  @Post(':id/photo')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Member UUID' })
  @ApiOperation({ summary: 'Upload and resize member photo (JPEG/PNG/WebP, max 2MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    return this.membersService.uploadPhoto(id, photo);
  }

  @Get(':id/export')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'id', description: 'Member UUID' })
  @ApiOperation({ summary: 'Export single member profile to PDF, Word, or Excel' })
  @ApiQuery({ name: 'format', enum: ExportFormat, required: false })
  async exportSingle(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('format') format: ExportFormat = ExportFormat.PDF,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, mimeType, filename } = await this.membersService.exportSingleMember(id, format);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Get(':id/id-card')
  @Roles('super_admin', 'admin', 'teacher', 'member')
  @ApiParam({ name: 'id', description: 'Member UUID' })
  @ApiOperation({ summary: 'Download member ID Card (PDF with photo & QR code)' })
  async getIdCard(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.membersService.generateIdCard(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Post(':id/letter')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Member UUID' })
  @ApiOperation({ summary: 'Generate official member letter (Confirmation / Recommendation PDF)' })
  async generateLetter(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateLetterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.membersService.generateLetter(id, dto);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }
}
