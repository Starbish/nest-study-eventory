import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateClubPayload {
  @IsInt()
  @IsPositive()
  @ApiProperty({
    description: '클럽장 유저 ID',
    type: Number,
  })
  ownerId!: number;

  @IsString()
  @ApiProperty({
    description: '클럽 이름',
    type: String,
  })
  title!: string;

  @IsString()
  @ApiPropertyOptional({
    description: '클럽 설명',
    type: String,
  })
  description!: string | null;
}
