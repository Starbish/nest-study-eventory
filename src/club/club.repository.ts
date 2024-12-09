import { Injectable } from '@nestjs/common';
import { ClubInfoDto } from './dto/club-info.dto';
import { PrismaService } from 'src/common/services/prisma.service';
import { ClubInfoData } from './type/club-info-data.type';
import { CreateClubData } from './type/create-club-data.type';
import { ClubJoinState } from '@prisma/client';
import { UpdateClubData } from './type/update-club-data.type';
import { EventData } from 'src/event/type/event-data.type';
import { LeaveClubData, LeaveClubEventAction } from './type/leave-club-data.type';

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

  async leaveClub(userId: number, tasks: LeaveClubData[], clubId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 관련된 Club 전용 Event에 대한 데이터 삭제
      for(let i = 0; i < tasks.length; i++) {
        if(tasks[i].action === LeaveClubEventAction.Leave) {
          await tx.eventJoin.delete({
            where: {
              eventId_userId: {
                eventId: tasks[i].eventId,
                userId: userId,
              },
            },
          });
        } else if(tasks[i].action === LeaveClubEventAction.LeaveAndDisband) {
          await tx.event.delete({
            where: {
              id: tasks[i].eventId,
            },
          });
        }
      }

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

  /* 아래 코드들은 Event db와 연관된 것들 */
  // 클럽의 모임들 중에서 user가 가입한 모든 event를 반환함
  async getUserClubEvents(
    userId: number,
    clubId: number,
  ): Promise<EventData[]> {
    return this.prisma.event.findMany({
      where: {
        clubId,
        eventJoin: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        eventCity: {
          select: {
            cityId: true,
          },
        },
        startTime: true,
        endTime: true,
        maxPeople: true,
      },
    });
  }

  async disbandClubEvent(eventId: number) {
    await this.prisma.event.delete({
      where: {
        id: eventId,
      },
    });
  }

  async leaveClubEvent(userId: number, eventId: number) {
    await this.prisma.eventJoin.delete({
      where: {
        eventId_userId: {
          userId,
          eventId,
        },
      },
    });
  }
}
