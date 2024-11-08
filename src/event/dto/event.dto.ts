import { ApiProperty } from '@nestjs/swagger';
import { EventData } from '../type/event-data.type';

// 멤버변수 뒤에 !를 붙여주는 건 이후에 반드시 초기화되는 대상이라는 걸 명시하는 것
export class EventDto {
  @ApiProperty({
    description: '모임 ID',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: '호스트 유저 ID',
    type: Number,
  })
  hostId!: number;

  @ApiProperty({
    description: '카테고리 ID',
    type: Number,
  })
  categoryId!: number;

  @ApiProperty({
    description: '모임 제목',
    type: String,
  })
  title!: string;

  @ApiProperty({
    description: '모임 설명(내용)',
    type: String,
  })
  description!: string;

  @ApiProperty({
    description: '지역 ID',
    type: Number,
  })
  cityId!: number;

  @ApiProperty({
    description: '모임 시작 시각',
    type: Date,
  })
  startTime!: Date;

  @ApiProperty({
    description: '모임 종료 시각',
    type: Date,
  })
  endTime!: Date;

  @ApiProperty({
    description: '모임 최대 정원 (주최자 포함)',
    type: Number,
  })
  maxPeople!: number;

  static from(event: EventData): EventDto {
    return {
      id: event.id,
      hostId: event.hostId,
      categoryId: event.categoryId,
      title: event.title,
      description: event.description,
      cityId: event.cityId,
      startTime: event.startTime,
      endTime: event.endTime,
      maxPeople: event.maxPeople,
    };
  }
}
