import { Injectable } from '@nestjs/common';
import { ClubInfoDto } from './dto/club-info.dto';
import { PrismaService } from 'src/common/services/prisma.service';
import { ClubInfoData } from './type/club-info-data.type';
import { CreateClubData } from './type/create-club-data.type';
import { ClubJoinState } from '@prisma/client';
import { UpdateClubData } from './type/update-club-data.type';
import { EventData } from 'src/event/type/event-data.type';

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
    userId: number,
    data: CreateClubData,
  ): Promise<ClubInfoData> {
    return this.prisma.club.create({
      data: {
        title: data.title,
        description: data.description,
        ownerId: userId,
        clubJoin: {
          create: {
            // 클럽장은 별도의 심사가 당연히 필요 없다
            userId: userId,
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
    data: UpdateClubData,
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
      },
    });
  }

  async joinClub(userId: number, clubId: number): Promise<void> {
    await this.prisma.clubJoin.create({
      data: {
        userId: userId,
        clubId: clubId,
        state: ClubJoinState.Applied,
      },
    });
  }

  async leaveClub(userId: number, clubId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // eventJoin
      // eventCity
      // event
      // clubJoin

      // Event host의 경우 Event disband
      // Event member의 경우 본인만 빠져나감

      // eventJoin 삭제 (이벤트 시작 전)
      // 호스트일 때, 아닐 때 동시에 처리 필요
      await tx.eventJoin.deleteMany({
        where: {
          OR: [
            // 모임의 멤버일 때
            {
              // eventJoin의 userId 값을 조건으로
              userId: userId,
              event: {
                startTime: {
                  gt: new Date(),
                },
              },
            },
            // 모임의 호스트일 때
            {
              event: {
                hostId: userId,
                startTime: {
                  gt: new Date(),
                },
              },
            },
          ],
        },
      });

      // 호스트일 때만 지우면 됨
      await tx.eventCity.deleteMany({
        where: {
          event: {
            hostId: userId,
            startTime: {
              gt: new Date(),
            },
          },
        },
      });

      // 호스트일 때만 지우면 됨
      await tx.event.deleteMany({
        where: {
          hostId: userId,
          startTime: {
            gt: new Date(),
          },
        },
      });

      // clubJoin row 삭제
      await tx.clubJoin.delete({
        where: {
          userId_clubId: {
            userId,
            clubId,
          },
        },
      });
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

  async getUserJoinState(id: number): Promise<{ state: ClubJoinState } | null> {
    return this.prisma.clubJoin.findUnique({
      where: {
        id: id,
      },
      select: {
        state: true,
      },
    });
  }
}
