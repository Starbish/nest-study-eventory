import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class DelegateClubOwnerPayload {
  @IsInt()
  @IsPositive()
  @ApiProperty({
    description: '클럽을 승계할 유저 ID',
    type: Number,
  })
  userId!: number;
}
