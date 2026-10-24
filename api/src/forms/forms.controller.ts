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
  ParseUUIDPipe,
  Req,
  Res,
  StreamableFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { FormsService } from './forms.service';
import {
  CreateFormDto,
  UpdateFormDto,
  SubmitResponseDto,
  ReviewResponseDto,
  QueryFormDto,
  QueryResponseDto,
  ExportFormResponsesDto,
} from './dto/form.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Public, CurrentUser } from '../common/decorators/auth.decorator';

@ApiTags('Online Forms & Builder')
@Controller('forms')
@UseGuards(RolesGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  // ---------------------------------------------------------------------------
  // 1. FORM BUILDER & TEMPLATES (Admin only)
  // ---------------------------------------------------------------------------

  @Post()
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'Build and save a new online form with custom JSON schema',
  })
  @ApiResponse({ status: 201, description: 'Form successfully created' })
  async createForm(@Body() dto: CreateFormDto, @CurrentUser('id') userId?: string) {
    return this.formsService.createForm(dto, userId);
  }

  @Get('templates')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'List 5 pre-configured ready templates (Renewal, Event, Volunteer, Pledge, Survey)',
  })
  async getTemplates() {
    return this.formsService.getTemplates();
  }

  @Post('from-template/:templateKey')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({
    name: 'templateKey',
    example: 'membership_renewal',
    description:
      'Template key: membership_renewal | event_registration | volunteer_signup | pledge | satisfaction_survey',
  })
  @ApiOperation({
    summary: 'Instantiate and save a new form from a pre-configured template',
  })
  async createFromTemplate(
    @Param('templateKey') templateKey: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.formsService.createFromTemplate(templateKey, userId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'List all forms with pagination, status, and search filters (Admin)',
  })
  async findAllForms(@Query() query: QueryFormDto) {
    return this.formsService.findAllForms(query);
  }

  // ---------------------------------------------------------------------------
  // 2. PUBLIC FORM ACCESS & SUBMISSIONS
  // ---------------------------------------------------------------------------

  @Get('public')
  @Public()
  @ApiOperation({
    summary: 'Public list of currently open and non-expired forms',
  })
  async findPublicForms(@Query() query: QueryFormDto) {
    return this.formsService.findPublicOpenForms(query);
  }

  @Get(':id/public')
  @Public()
  @ApiParam({ name: 'id', description: 'Form UUID' })
  @ApiOperation({
    summary: 'Publicly inspect an open form title, description, and schema',
  })
  async findOnePublicForm(@Param('id', ParseUUIDPipe) id: string) {
    const form = await this.formsService.findOneForm(id);
    if (form.status !== 'open') {
      throw new BadRequestException('Form is not open for public viewing');
    }
    return form;
  }

  @Post('upload')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload an attachment (receipt, ID card, document) for a form field',
  })
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
  async uploadFormFieldFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.formsService.uploadFormFieldFile(file);
  }

  @Post(':id/submit')
  @Public()
  @ApiParam({ name: 'id', description: 'Form UUID' })
  @ApiOperation({
    summary: 'Submit answers to an open form (validates schema, one-response rule, cutoff)',
  })
  async submitResponse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitResponseDto,
    @CurrentUser('id') userId?: string,
    @Req() req?: Request,
  ) {
    const clientIp = req?.ip || req?.socket?.remoteAddress;
    return this.formsService.submitResponse(id, dto, userId, clientIp);
  }

  @Post(':id/responses')
  @Public()
  @ApiParam({ name: 'id', description: 'Form UUID' })
  @ApiOperation({ summary: 'Submit response alias for :id/submit' })
  async submitResponseAlias(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitResponseDto,
    @CurrentUser('id') userId?: string,
    @Req() req?: Request,
  ) {
    const clientIp = req?.ip || req?.socket?.remoteAddress;
    return this.formsService.submitResponse(id, dto, userId, clientIp);
  }

  // ---------------------------------------------------------------------------
  // 3. ADMIN FORM MANAGEMENT (Get, Update, Delete)
  // ---------------------------------------------------------------------------

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Form UUID' })
  @ApiOperation({ summary: 'Get full details of a form (Admin)' })
  async findOneForm(@Param('id', ParseUUIDPipe) id: string) {
    return this.formsService.findOneForm(id);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Form UUID' })
  @ApiOperation({ summary: 'Update form schema, title, status, or deadline' })
  async updateForm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFormDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.formsService.updateForm(id, dto, userId);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Form UUID' })
  @ApiOperation({ summary: 'Partially update form properties' })
  async patchForm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFormDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.formsService.updateForm(id, dto, userId);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Form UUID' })
  @ApiOperation({ summary: 'Delete a form and all its responses' })
  async deleteForm(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId?: string) {
    return this.formsService.deleteForm(id, userId);
  }

  // ---------------------------------------------------------------------------
  // 4. ADMIN RESPONSE REVIEW & EXPORTS
  // ---------------------------------------------------------------------------

  @Get(':id/responses')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Form UUID' })
  @ApiOperation({
    summary: 'List responses for a specific form with filters and pagination',
  })
  async findFormResponses(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryResponseDto,
  ) {
    return this.formsService.findFormResponses(id, query);
  }

  @Get('submissions/me')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiOperation({ summary: 'List form submissions made by the logged-in member' })
  async findMySubmissions(@CurrentUser() user: any) {
    return this.formsService.findMyResponses(user);
  }

  @Get('responses/:responseId')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'responseId', description: 'Form Response UUID' })
  @ApiOperation({ summary: 'Get single form response with answers and member' })
  async findOneResponse(@Param('responseId', ParseUUIDPipe) responseId: string) {
    return this.formsService.findOneResponse(responseId);
  }

  @Patch('responses/:responseId/review')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'responseId', description: 'Form Response UUID' })
  @ApiOperation({
    summary: 'Approve or reject a response with an administrative review note',
  })
  async reviewResponse(
    @Param('responseId', ParseUUIDPipe) responseId: string,
    @Body() dto: ReviewResponseDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.formsService.reviewResponse(responseId, dto, userId);
  }

  @Get(':id/export')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Form UUID' })
  @ApiOperation({
    summary: 'Export form responses to styled Excel (.xlsx) or Puppeteer PDF (.pdf)',
  })
  async exportResponses(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ExportFormResponsesDto,
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, mimeType, filename } = await this.formsService.exportResponses(
      id,
      query.format,
      query,
      userId,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    });
    return new StreamableFile(buffer);
  }

  @Get(':id/responses/export')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Form UUID' })
  @ApiOperation({ summary: 'Export responses alias for :id/export' })
  async exportResponsesAlias(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ExportFormResponsesDto,
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return this.exportResponses(id, query, userId, res);
  }
}
