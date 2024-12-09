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

export class PutUpdateEventPayload {
  @IsString()
  @ApiProperty({
    description: '이름',
    type: String,
  })
  title!: string;

  @IsString()
  @ApiProperty({
    description: '설명',
    type: String,
  })
  description!: string;

  @IsInt()
  @IsPositive()
  @ApiProperty({
    description: '카테고리 ID',
    type: Number,
  })
  categoryId!: number;

  @IsInt({ each: true })
  @IsPositive({ each: true })
  @IsArray()
  @ApiProperty({
    description: '도시 IDs',
    type: [Number],
  })
  cityIds!: number[];

  @Type(() => Date)
  @IsDate()
  @ApiProperty({
    description: '시작 시간',
    type: Date,
  })
  startTime!: Date;

  @Type(() => Date)
  @IsDate()
  @ApiProperty({
    description: '종료 시간',
    type: Date,
  })
  endTime!: Date;

  @Min(2)
  @IsInt()
  @ApiProperty({
    description: '최대 인원',
    type: Number,
  })
  maxPeople!: number;

  @IsInt()
  @IsPositive()
  @ApiPropertyOptional({
    description: '클럽 ID (클럽 전용인 경우에만 활성화)',
    type: Number,
  })
  clubId!: number | null;
}
