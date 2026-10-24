import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

function redactSensitive(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitive);
  const copy: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lower = key.toLowerCase();
    if (
      lower.includes('password') ||
      lower.includes('secret') ||
      lower.includes('token') ||
      lower.includes('code') ||
      lower.includes('hash') ||
      lower.includes('otp')
    ) {
      copy[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      copy[key] = redactSensitive(value);
    } else {
      copy[key] = value;
    }
  }
  return copy;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;
    const user = (request as any).user;
    const ip = request.ip || request.socket.remoteAddress || 'unknown';

    const isLogin = url.includes('/auth/login') && method === 'POST';
    const isRegister = url.includes('/auth/register') && method === 'POST';
    const isExport = url.includes('/export') && method === 'GET';
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    const shouldAudit = isLogin || isRegister || isExport || isMutation;

    return next.handle().pipe(
      tap({
        next: async (responseData) => {
          if (!shouldAudit) return;

          let action = `${method} ${url}`;
          let entity = 'system';
          let entityId: string | undefined = undefined;

          if (isLogin) {
            action = 'LOGIN_SUCCESS';
            entity = 'user';
            entityId = responseData?.user?.id;
          } else if (isRegister) {
            action = 'REGISTER_MEMBER';
            entity = 'user';
            entityId = responseData?.user?.id;
          } else if (isExport) {
            action = 'EXPORT';
            entity = 'report';
          } else {
            action = `${method}_${url.split('/')[2] || 'RECORD'}`.toUpperCase();
            entity = url.split('/')[2] || 'record';
            entityId = responseData?.id || request.params?.id;
          }

          try {
            await this.prisma.auditLog.create({
              data: {
                userId: user?.id || entityId || null,
                action,
                entity,
                entityId: entityId ? String(entityId) : null,
                newValue: responseData
                  ? isExport || (responseData as any)?.getStream
                    ? { exported: true, type: isExport ? 'export' : 'stream' }
                    : typeof responseData === 'object'
                      ? redactSensitive(responseData)
                      : null
                  : null,
                ip: String(ip),
              },
            });
          } catch (err: any) {
            this.logger.error(`Failed to record audit log: ${err.message}`);
          }
        },
      }),
    );
  }
}
