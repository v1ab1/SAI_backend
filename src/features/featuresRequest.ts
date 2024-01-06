import { ApiProperty } from '@nestjs/swagger';

export class GetFeatures {
  @ApiProperty({
    type: 'string',
  })
  fileName: string;

  @ApiProperty({
    type: 'string',
  })
  value: string;
}
