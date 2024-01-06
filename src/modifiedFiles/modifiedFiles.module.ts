import { Module } from '@nestjs/common';
import { ModifiedFilesService } from './modifiedFiles.service';
import { ModifiedFilesController } from './modifiedFiles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModifiedFileEntity } from './entities/modifiedFiles.entity';

@Module({
  controllers: [ModifiedFilesController],
  providers: [ModifiedFilesService],
  imports: [TypeOrmModule.forFeature([ModifiedFileEntity])],
  exports: [ModifiedFilesService],
})
export class ModifiedFilesModule {}
