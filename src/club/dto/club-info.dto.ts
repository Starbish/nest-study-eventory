import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClubInfoData } from '../type/club-info-data.type';

export class ClubInfoDto {
  @ApiProperty({
    description: '클럽 ID',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: '클럽 이름',
    type: String,
  })
  title!: string;

  // 해당 값이 존재하지 않을 수도 있음
  @ApiPropertyOptional({
    description: '클럽 설명',
    type: String,
  })
  description?: string | null;

  @ApiProperty({
    description: '클럽장 유저 ID',
    type: Number,
  })
  ownerId!: number;

  static from(data: ClubInfoData): ClubInfoDto {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      ownerId: data.ownerId,
    };
  }
}