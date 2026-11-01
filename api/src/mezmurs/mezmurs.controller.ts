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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MezmursService } from './mezmurs.service';
import {
  CreateMezmurCategoryDto,
  UpdateMezmurCategoryDto,
  CreateMezmurDto,
  UpdateMezmurDto,
  QueryMezmurDto,
} from './dto/mezmur.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Public, CurrentUser } from '../common/decorators/auth.decorator';

@ApiTags('Mezmur & Categories')
@Controller('mezmurs')
@UseGuards(RolesGuard)
export class MezmursController {
  constructor(private readonly mezmursService: MezmursService) {}

  // =========================================================================
  // 1. MEZMUR CATEGORIES
  // =========================================================================

  @Post('categories')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiOperation({ summary: 'Create a mezmur category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createCategory(@Body() dto: CreateMezmurCategoryDto) {
    return this.mezmursService.createCategory(dto);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List all mezmur categories (public)' })
  async findAllCategories(@Query() query: PaginationDto) {
    return this.mezmursService.findAllCategories(query);
  }

  @Put('categories/:id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiOperation({ summary: 'Update mezmur category' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMezmurCategoryDto,
  ) {
    return this.mezmursService.updateCategory(id, dto);
  }

  @Patch('categories/:id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiOperation({ summary: 'Partially update mezmur category' })
  async patchCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMezmurCategoryDto) {
    return this.mezmursService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiOperation({ summary: 'Delete mezmur category' })
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.mezmursService.deleteCategory(id);
  }

  // =========================================================================
  // 2. PUBLIC MEZMUR ENDPOINTS & FAVORITES LIST
  // =========================================================================

  @Get('public')
  @Public()
  @ApiOperation({
    summary: 'Public listing of mezmurs (isPublic = true) with full-text search on title & lyrics',
  })
  async findPublicMezmurs(@Query() query: QueryMezmurDto) {
    return this.mezmursService.findAllMezmurs(query, true);
  }

  @Get('public/:id')
  @Public()
  @ApiParam({ name: 'id', description: 'Mezmur UUID' })
  @ApiOperation({ summary: 'Get a single public mezmur by ID' })
  async findOnePublicMezmur(@Param('id', ParseUUIDPipe) id: string) {
    return this.mezmursService.findOneMezmur(id, true);
  }

  @Get('favorites/me')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiOperation({ summary: 'List favorite mezmurs for the logged-in member' })
  async findMyFavorites(@Query() query: PaginationDto, @CurrentUser() user: any) {
    return this.mezmursService.findMyFavorites(query, user);
  }

  // =========================================================================
  // 3. MEZMUR CRUD & AUDIO/VIDEO UPLOADS
  // =========================================================================

  @Post()
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiOperation({ summary: 'Create a new mezmur' })
  @ApiResponse({ status: 201, description: 'Mezmur created' })
  async createMezmur(@Body() dto: CreateMezmurDto, @CurrentUser('id') userId?: string) {
    return this.mezmursService.createMezmur(dto, userId);
  }

  @Post('upload-audio')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiOperation({ summary: 'Upload standalone mezmur audio file (MP3/WAV/OGG/M4A/AAC, max 25MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudioFile(@UploadedFile() file: Express.Multer.File) {
    return this.mezmursService.uploadStandaloneAudio(file);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiOperation({
    summary: 'List all mezmurs with full-text search on title and lyrics',
  })
  async findAllMezmurs(@Query() query: QueryMezmurDto, @CurrentUser() user: any) {
    return this.mezmursService.findAllMezmurs(query, false, user);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiParam({ name: 'id', description: 'Mezmur UUID' })
  @ApiOperation({ summary: 'Get mezmur details by ID' })
  async findOneMezmur(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.mezmursService.findOneMezmur(id, false, user);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Mezmur UUID' })
  @ApiOperation({ summary: 'Update mezmur' })
  async updateMezmur(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMezmurDto) {
    return this.mezmursService.updateMezmur(id, dto);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Mezmur UUID' })
  @ApiOperation({ summary: 'Partially update mezmur' })
  async patchMezmur(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMezmurDto) {
    return this.mezmursService.updateMezmur(id, dto);
  }

  @Post(':id/audio')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Mezmur UUID' })
  @ApiOperation({ summary: 'Upload mezmur audio file (MP3/WAV/OGG/M4A/AAC, max 25MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mezmursService.uploadMezmurMedia(id, file, 'audio');
  }

  @Post(':id/video')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Mezmur UUID' })
  @ApiOperation({ summary: 'Upload mezmur video file (MP4/WebM/OGG/MOV, max 50MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mezmursService.uploadMezmurMedia(id, file, 'video');
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Mezmur UUID' })
  @ApiOperation({ summary: 'Delete mezmur' })
  async deleteMezmur(@Param('id', ParseUUIDPipe) id: string) {
    return this.mezmursService.deleteMezmur(id);
  }

  // =========================================================================
  // 4. MEMBER FAVORITES (ADD / REMOVE)
  // =========================================================================

  @Post(':id/favorite')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiParam({ name: 'id', description: 'Mezmur UUID' })
  @ApiOperation({ summary: 'Add mezmur to member favorites' })
  async addFavorite(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.mezmursService.addFavorite(id, user);
  }

  @Delete(':id/favorite')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiParam({ name: 'id', description: 'Mezmur UUID' })
  @ApiOperation({ summary: 'Remove mezmur from member favorites' })
  async removeFavorite(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.mezmursService.removeFavorite(id, user);
  }
}
