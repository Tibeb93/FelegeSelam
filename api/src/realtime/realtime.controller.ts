import { Controller, Sse, Query, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { EventBusService, SseMessageEvent } from './event-bus.service';
import { Public } from '../common/decorators/auth.decorator';
import { Request } from 'express';

@ApiTags('Realtime Events (SSE)')
@Controller('realtime')
export class RealtimeController {
  constructor(
    private readonly eventBusService: EventBusService,
    private readonly jwtService: JwtService,
  ) {}

  @Sse('stream')
  @Public()
  @ApiOperation({
    summary: 'Server-Sent Events (SSE) live one-way event stream with heartbeat',
  })
  @ApiQuery({
    name: 'token',
    required: false,
    description: 'JWT bearer token for authenticated user channels',
  })
  stream(
    @Query('token') queryToken?: string,
    @Headers('authorization') authHeader?: string,
    @Req() req?: Request,
  ): Observable<SseMessageEvent> {
    let rawToken = queryToken;

    if (!rawToken && authHeader && authHeader.startsWith('Bearer ')) {
      rawToken = authHeader.slice(7).trim();
    }

    let userId: string | undefined;
    let role: string | undefined;

    if (rawToken) {
      try {
        const decoded = this.jwtService.verify(rawToken);
        userId = decoded.sub || decoded.id;
        role = decoded.role?.name || decoded.role;
      } catch {
        // Invalid or expired token: fall back to public visitor stream
      }
    }

    return this.eventBusService.streamForUser(userId, role);
  }
}
