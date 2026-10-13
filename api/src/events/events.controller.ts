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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  UpdateEventDto,
  QueryEventDto,
  RsvpEventDto,
  QueryAttendeesDto,
} from './dto/event.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Public, CurrentUser } from '../common/decorators/auth.decorator';

@ApiTags('Events & RSVPs')
@Controller('events')
@UseGuards(RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiOperation({ summary: 'Create a new church / Sunday school event' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async createEvent(@Body() dto: CreateEventDto, @CurrentUser('id') userId?: string) {
    return this.eventsService.createEvent(dto, userId);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Public paginated list of events with RSVP summary counts',
  })
  async findAllEvents(@Query() query: QueryEventDto) {
    return this.eventsService.findAllEvents(query);
  }

  @Get(':id')
  @Public()
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiOperation({ summary: 'Get event details with RSVP summary' })
  async findOneEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOneEvent(id);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiOperation({ summary: 'Update event details' })
  async updateEvent(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.updateEvent(id, dto);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiOperation({ summary: 'Partially update event details' })
  async patchEvent(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.updateEvent(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'content_manager')
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiOperation({ summary: 'Delete an event' })
  async deleteEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.deleteEvent(id);
  }

  @Post(':id/rsvp')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiOperation({
    summary: 'RSVP to an event (going, maybe, not_going) with capacity check',
  })
  @ApiResponse({ status: 201, description: 'RSVP recorded' })
  @ApiResponse({ status: 400, description: 'Event capacity reached' })
  async rsvpToEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RsvpEventDto,
    @CurrentUser() user: any,
  ) {
    return this.eventsService.rsvpToEvent(id, dto, user);
  }

  @Get(':id/attendees')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager', 'member')
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiOperation({ summary: 'List event attendees and RSVPs with pagination' })
  async findEventAttendees(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryAttendeesDto,
  ) {
    return this.eventsService.findEventAttendees(id, query);
  }
}
