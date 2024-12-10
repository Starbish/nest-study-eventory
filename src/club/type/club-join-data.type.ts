import { ClubJoinState } from '@prisma/client';

export type ClubJoinData = {
  id: number;
  userId: number;
  clubId: number;
  state: ClubJoinState;
};
