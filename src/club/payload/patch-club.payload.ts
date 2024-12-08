import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
} from 'class-validator';
import { IsOptionalNonNullable } from 'src/common/decorator';

export class PatchClubPayload {
  @IsString()
  @IsOptionalNonNullable()
  @ApiPropertyOptional({
    description: '클럽 이름',
    type: String,
  })
  title?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: '클럽 설명',
    type: String,
  })
  description?: string | null;
}
