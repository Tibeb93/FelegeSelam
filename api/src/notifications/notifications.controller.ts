import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  SendNotificationDto,
  RegisterDeviceTokenDto,
  QueryNotificationDto,
} from './dto/notification.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators/auth.decorator';

@ApiTags('Notifications & Device Tokens')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiOperation({
    summary: 'List in-app notifications for the logged-in user (with unreadCount)',
  })
  async findMyNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: QueryNotificationDto,
  ) {
    return this.notificationsService.findMyNotifications(userId, query);
  }

  @Get('history')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiOperation({
    summary:
      'List notification dispatch history with pagination and search (Admin/Content Manager)',
  })
  async findNotificationHistory(@Query() query: QueryNotificationDto) {
    return this.notificationsService.findNotificationHistory(query);
  }

  @Patch('read-all')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiOperation({ summary: 'Mark all unread notifications as read for current user' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markAsRead(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Post('send')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiOperation({
    summary: 'Admin endpoint to send notifications to everyone, a department, or one user',
  })
  @ApiResponse({ status: 201, description: 'Notifications dispatched' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationsService.sendNotification(dto);
  }

  @Post('device-tokens')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiOperation({ summary: 'Register a push notification device token for current user' })
  async registerDeviceToken(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.notificationsService.registerDeviceToken(userId, dto);
  }
}

@ApiTags('Notifications & Device Tokens')
@ApiBearerAuth('JWT-auth')
@Controller('device-tokens')
@UseGuards(RolesGuard)
export class DeviceTokensController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiOperation({ summary: 'Register a push notification device token (android, ios, web)' })
  async registerDeviceToken(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.notificationsService.registerDeviceToken(userId, dto);
  }

  @Get()
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiOperation({ summary: 'List registered device tokens for current user' })
  async listMyDeviceTokens(@CurrentUser('id') userId: string) {
    return this.notificationsService.listMyDeviceTokens(userId);
  }

  @Delete(':token')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiParam({ name: 'token', description: 'Device token string to remove' })
  @ApiOperation({ summary: 'Unregister a device token' })
  async removeDeviceToken(@CurrentUser('id') userId: string, @Param('token') token: string) {
    return this.notificationsService.removeDeviceToken(userId, token);
  }
}
