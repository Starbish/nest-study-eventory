import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class EventInOutPayload {
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: '호스트 유저 ID',
    type: Number,
  })
  userId!: number;
}
