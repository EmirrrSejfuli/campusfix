import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Watch } from './watch.entity';
import { WatchesService } from './watches.service';
import { WatchesController } from './watches.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Watch]), UsersModule],
  providers: [WatchesService],
  controllers: [WatchesController],
  exports: [WatchesService],
})
export class WatchesModule {}
