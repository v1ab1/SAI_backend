import { Module } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { FeaturesController } from './features.controller';
import { ModifiedFilesModule } from 'src/modifiedFiles/modifiedFiles.module';

@Module({
  controllers: [FeaturesController],
  providers: [FeaturesService],
  imports: [ModifiedFilesModule],
})
export class FeaturesModule {}
