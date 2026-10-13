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
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, QueryPostDto } from './dto/post.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Public, CurrentUser } from '../common/decorators/auth.decorator';

@ApiTags('Posts (Daily Spiritual Content)')
@Controller('posts')
@UseGuards(RolesGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('today')
  @Public()
  @ApiOperation({
    summary: 'Get today’s active published posts (urgent items first)',
  })
  async findTodayPosts() {
    return this.postsService.findTodayPosts();
  }

  @Get('manage')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiOperation({
    summary: 'List all posts for management (includes future scheduled and expired posts)',
  })
  async findAllForManagement(@Query() query: QueryPostDto) {
    return this.postsService.findAllForManagement(query);
  }

  @Post('scheduler/run')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiOperation({
    summary: 'Run the scheduled posts publication and expiration job immediately',
  })
  async runSchedulerNow() {
    return this.postsService.processScheduledAndExpiredPosts();
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiOperation({
    summary: 'Create a post (sinksar, bible_reading, saint_of_day, urgent, event, news, teaching)',
  })
  @ApiResponse({ status: 201, description: 'Post created' })
  async createPost(@Body() dto: CreatePostDto, @CurrentUser('id') userId?: string) {
    return this.postsService.createPost(dto, userId);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Public paginated list of currently published and non-expired posts',
  })
  async findPublicPosts(@Query() query: QueryPostDto) {
    return this.postsService.findPublicPosts(query);
  }

  @Get(':id')
  @Public()
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiOperation({ summary: 'Get a single post by ID' })
  async findOnePost(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.findOnePost(id, false);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiOperation({ summary: 'Update a post' })
  async updatePost(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.updatePost(id, dto);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiOperation({ summary: 'Partially update a post' })
  async patchPost(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.updatePost(id, dto);
  }

  @Post(':id/image')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiOperation({ summary: 'Upload and optimize post cover image (JPEG/PNG/WebP, max 5MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  async uploadPostImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.postsService.uploadPostImage(id, image);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Post UUID' })
  @ApiOperation({ summary: 'Delete a post' })
  async deletePost(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.deletePost(id);
  }
}
