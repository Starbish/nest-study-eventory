import { Injectable } from '@nestjs/common';
import { ClubInfoDto } from './dto/club-info.dto';
import { PrismaService } from 'src/common/services/prisma.service';
import { ClubInfoData } from './type/club-info-data.type';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { CreateClubData } from './type/create-club-data.type';
import { ClubJoinState } from '@prisma/client';
import { UpdateClubData } from './type/update-club-data.type';

@Injectable()
export class ClubRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getClubInfo(clubId: number): Promise<ClubInfoData | null> {
    return this.prisma.club.findUnique({
      where: {
        id: clubId,
      },
    });
  }

  async createClub(
    user: UserBaseInfo,
    data: CreateClubData,
  ): Promise<ClubInfoData> {
    return this.prisma.club.create({
      data: {
        title: data.title,
        description: data.description,
        ownerId: user.id,
        clubJoin: {
          create: {
            // 클럽장은 별도의 심사가 당연히 필요 없다
            userId: user.id,
            state: ClubJoinState.Accepted,
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        ownerId: true,
      },
    });
  }

  async updateClubInfo(
    clubId: number,
    data: UpdateClubData
  ): Promise<ClubInfoData> {
    return this.prisma.club.update({
      where: {
        id: clubId,
      },
      data: {
        title: data.title,
        description: data.description,
      },
      select: {
        id: true,
        title: true,
        description: true,
        ownerId: true,
      }
    });
  }

  async findClubByTitle(title: string): Promise<ClubInfoData | null> {
    return this.prisma.club.findFirst({
      where: {
        title,
      },
    });
  }

  async findClubByIndex(id: number): Promise<ClubInfoData | null> {
    return this.prisma.club.findFirst({
      where: {
        id,
      },
    });
  }
}
