import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IssuesModule } from './issues/issues.module';
import { CategoriesModule } from './categories/categories.module';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WatchesModule } from './watches/watches.module';
import { CommentsModule } from './comments/comments.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global rate limit as a baseline anti-abuse measure (per IP): 60 requests / minute.
    // Stricter, endpoint-specific limits (e.g. on report creation) are applied with @Throttle().
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        if (databaseUrl) {
          // Production (e.g. Neon): a single connection string, which requires SSL.
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl: { rejectUnauthorized: false },
            autoLoadEntities: true,
            synchronize: true, // OK for prototype/dev; use migrations in production
          };
        }
        // Local development (Docker Compose): separate connection fields, no SSL.
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST', 'localhost'),
          port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
          username: config.get<string>('DB_USERNAME', 'campusfix'),
          password: config.get<string>('DB_PASSWORD', 'campusfix_password'),
          database: config.get<string>('DB_DATABASE', 'campusfix'),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    IssuesModule,
    CategoriesModule,
    AiModule,
    NotificationsModule,
    WatchesModule,
    CommentsModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
