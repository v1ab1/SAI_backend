import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FeaturesService } from './features.service';
import { featureInfo } from './dto/create-feature.dto';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { UserId } from 'src/decorators/user-id.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileStorage } from 'src/files/storage';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { GetFeatures } from './featuresRequest';

@Controller('features')
@ApiTags('features')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Post('/empty')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: fileStorage,
    }),
  )
  @ApiBody({ type: GetFeatures })
  empty(@UserId() userId: number, @Body() dto: featureInfo) {
    return this.featuresService.getEmpty(dto, userId);
  }

  @Post('/emissionsy')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: fileStorage,
    }),
  )
  @ApiBody({ type: GetFeatures })
  emissionsy(@UserId() userId: number, @Body() dto: featureInfo) {
    return this.featuresService.getEmissionsy(dto, userId);
  }

  @Post('/normalization')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: fileStorage,
    }),
  )
  @ApiBody({ type: GetFeatures })
  normalization(@UserId() userId: number, @Body() dto: featureInfo) {
    return this.featuresService.getNormalization(dto, userId);
  }

  @Post('/modeling')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: fileStorage,
    }),
  )
  @ApiBody({ type: GetFeatures })
  modeling(@UserId() userId: number, @Body() dto: featureInfo) {
    return this.featuresService.getModeling(dto);
  }

  @Post('/definition')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: fileStorage,
    }),
  )
  @ApiBody({ type: GetFeatures })
  definition(@UserId() userId: number, @Body() dto: featureInfo) {
    return this.featuresService.getDefinition(dto);
  }
}
