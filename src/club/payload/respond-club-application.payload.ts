import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsPositive } from 'class-validator';

export class RespondClubApplicationPayload {
  @IsBoolean()
  @ApiProperty({
    description: '클럽 가입의 승인/거절 여부',
    type: Boolean,
  })
  decision!: boolean;
}
