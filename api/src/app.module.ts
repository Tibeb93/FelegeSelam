import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './config/env.schema';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { StorageModule } from './storage/storage.module';
import { MembersModule } from './members/members.module';
import { CoursesModule } from './courses/courses.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MezmursModule } from './mezmurs/mezmurs.module';
import { PostsModule } from './posts/posts.module';
import { EventsModule } from './events/events.module';
import { FormsModule } from './forms/forms.module';
import { ReportsModule } from './reports/reports.module';
import { ContributionsModule } from './contributions/contributions.module';
import { SettingsModule } from './settings/settings.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { BackupsModule } from './backups/backups.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { RequestLoggingMiddleware } from './common/middleware/logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // global rate limit
      },
    ]),
    PrismaModule,
    MailModule,
    StorageModule,
    MembersModule,
    CoursesModule,
    NotificationsModule,
    MezmursModule,
    PostsModule,
    EventsModule,
    FormsModule,
    ReportsModule,
    ContributionsModule,
    SettingsModule,
    AuditLogsModule,
    BackupsModule,
    AuthModule,
    UsersModule,
    HealthModule,
  ],
  providers: [
    // Global JWT Authentication Guard (all routes protected unless @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Audit Interceptor (writes to AuditLog on mutations, login, register, export)
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
