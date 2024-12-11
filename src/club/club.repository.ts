import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { ClubInfoData } from './type/club-info-data.type';
import { CreateClubData } from './type/create-club-data.type';
import { ClubJoinState } from '@prisma/client';
import { UpdateClubData } from './type/update-club-data.type';
import { EventData } from 'src/event/type/event-data.type';
import { ClubJoinData } from './type/club-join-data.type';
import { UserData } from 'src/user/type/user-data.type';

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

  async delegateClubOwner(clubId: number, userId: number): Promise<void> {
    await this.prisma.club.update({
      where: {
        id: clubId,
      },
      data: {
        ownerId: userId,
      },
    });
  }

  async respondClubApplication(
    userId: number,
    clubId: number,
    decision: boolean,
  ): Promise<void> {
    const state = decision ? ClubJoinState.Accepted : ClubJoinState.Applied;
    await this.prisma.clubJoin.update({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },

      data: {
        state,
      },
    });
  }

  async disbandClub(clubId: number): Promise<void> {
    // Event 중에서 아직 시작 대기중인 것들은 삭제한다.
    // Event 를 삭제하기 전에, Event 에 종속적인 것들을 먼저 삭제
    // EventCity 삭제
    const time = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.eventCity.deleteMany({
        where: {
          event: {
            club: {
              id: clubId,
            },
            startTime: {
              gt: time,
            },
          },
        },
      });

      // EventJoin 삭제
      await tx.eventJoin.deleteMany({
        where: {
          event: {
            club: {
              id: clubId,
            },
            startTime: {
              gt: time,
            },
          },
        },
      });

      // Event 삭제
      await tx.event.deleteMany({
        where: {
          clubId,
          startTime: {
            gt: time,
          },
        },
      });

      // 시작하고 나서의 Event라면, 데이터를 지우지 않고 아카이브화 한다.
      await tx.event.updateMany({
        where: {
          clubId,
          startTime: {
            lte: time,
          },
        },
        data: {
          clubId: null,
          isArchived: true,
        },
      });

      // Event 관련 데이터를 삭제 & 아카이빙했다면, 아래는 Club 관련
      await tx.clubJoin.deleteMany({
        where: {
          clubId,
        },
      });

      await tx.club.delete({
        where: {
          id: clubId,
        },
      });
    });
  }

  async getClubApplicationList(clubId: number): Promise<UserData[]> {
    const result = await this.prisma.clubJoin.findMany({
      where: {
        club: {
          id: clubId,
        },
        state: ClubJoinState.Applied,
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            birthday: true,
            cityId: true,
            categoryId: true,
          },
        },
      },
    });

    // UserData 에 맞게 살짝 갈무리
    return result.map((data) => data.user);
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

  // 완전 엉망인 코드를 쓰고 있었네요...
  async getUserClubJoinData(
    userId: number,
    clubId: number,
  ): Promise<ClubJoinData | null> {
    return this.prisma.clubJoin.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
      // ClubJoinData
      select: {
        id: true,
        userId: true,
        clubId: true,
        state: true,
      },
    });
  }

  // id = clubJoin ID
  async getClubJoinFromId(clubJoinId: number): Promise<ClubJoinData | null> {
    return this.prisma.clubJoin.findUnique({
      where: {
        id: clubJoinId,
      },
      // ClubJoinData
      select: {
        id: true,
        userId: true,
        clubId: true,
        state: true,
      },
    });
  }
}
