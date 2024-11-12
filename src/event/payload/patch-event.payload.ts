import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class PatchEventPayload {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '모임 이름',
    type: String,
  })
  title?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '모임 설명',
    type: String,
  })
  description?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: '모임 카테고리',
    type: Number,
  })
  categoryId?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: '모임 지역(도시)',
    type: Number,
  })
  cityId?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @ApiProperty({
    description: '모임 시작 시각',
    type: Date,
  })
  startTime?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @ApiProperty({
    description: '모임 종료 시각',
    type: Date,
  })
  endTime?: Date;

  @IsNumber()
  @IsOptional()
  @Min(2)
  @ApiProperty({
    description: '모임 최대 정원 (주최자 포함)',
    type: Number,
  })
  maxPeople?: number;
}
