import { PartialType } from '@nestjs/swagger';
import { CreateFileDto } from './create-modifiedFiles.dto';

export class UpdateFileDto extends PartialType(CreateFileDto) {}
