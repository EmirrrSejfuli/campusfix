import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminZone } from './admin-zone.entity';
import { AdminZonesService } from './admin-zones.service';
import { AdminZonesController } from './admin-zones.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([AdminZone]), UsersModule],
  providers: [AdminZonesService],
  controllers: [AdminZonesController],
  exports: [AdminZonesService],
})
export class AdminZonesModule {}
