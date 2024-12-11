import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateEventData } from './type/create-event-data.type';
import { Category, City, ClubJoinState } from '@prisma/client';
import { EventDetailData } from './type/event-detail-data.type';
import { EventQuery } from './query/event.query';
import { EventData } from './type/event-data.type';
import { UpdateEventData } from './type/update-event-data.type';

@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(data: CreateEventData): Promise<EventData> {
    return this.prisma.event.create({
      data: {
        hostId: data.hostId,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        startTime: data.startTime,
        endTime: data.endTime,
        maxPeople: data.maxPeople,
        clubId: data.clubId,
        eventCity: {
          createMany: {
            data: data.cityIds.map((cityId) => ({
              cityId,
            })),
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
        clubId: true,
        isArchived: true,
      },
    });
  }

  async updateEvent(id: number, data: UpdateEventData): Promise<EventData> {
    return this.prisma.event.update({
      where: {
        id,
      },
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        eventCity: data.cityIds
          ? {
              deleteMany: {},
              createMany: {
                data: data.cityIds.map((cityId) => ({
                  cityId,
                })),
              },
            }
          : undefined,
        startTime: data.startTime,
        endTime: data.endTime,
        maxPeople: data.maxPeople,
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
        clubId: true,
        isArchived: true,
      },
    });
  }

  async deleteEvent(id: number): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.eventJoin.deleteMany({
        where: {
          eventId: id,
        },
      }),
      this.prisma.eventCity.deleteMany({
        where: {
          eventId: id,
        },
      }),
      this.prisma.event.delete({
        where: {
          id,
        },
      }),
    ]);
  }

  async findCategoryById(id: number): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: {
        id,
      },
    });
  }

  async findCitiesByIds(ids: number[]): Promise<City[]> {
    return this.prisma.city.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  async findEventById(id: number): Promise<EventData | null> {
    return this.prisma.event.findUnique({
      where: {
        id,
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
        clubId: true,
        isArchived: true,
      },
    });
  }

  async getEvents(userId: number, query: EventQuery): Promise<EventData[]> {
    return this.prisma.event.findMany({
      where: {
        categoryId: query.categoryId,
        eventCity: {
          some: {
            cityId: query.cityId,
          },
        },
        host: {
          id: query.hostId,
          deletedAt: null,
        },
        OR: [
          // club_id 가 null 이어도 가져와야 하고
          {
            clubId: null,
            OR: [
              // 아카이브된 모임이라면 요청한 사람이 속해있는지 확인
              {
                isArchived: true,
                eventJoin: {
                  some: {
                    userId: userId,
                  },
                },
              },
              // 아카이브 되지 않은, 클럽 전용이 아닌 모임도 보여주어야 함
              {
                isArchived: false,
              },
            ],
          },
          // club_id 가 null 이 아니라면, 요청하는 유저가 권한이 있는지를 확인해야 함
          {
            clubId: { not: null },
            club: {
              clubJoin: {
                some: {
                  userId: userId,
                  state: ClubJoinState.Accepted,
                },
              },
            },
          },
        ],
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
        clubId: true,
        isArchived: true,
      },
    });
  }

  async getEventsJoinedBy(userId: number): Promise<EventData[]> {
    return this.prisma.event.findMany({
      where: {
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
        clubId: true,
        isArchived: true,
      },
    });
  }

  async getParticipantsIds(eventId: number): Promise<number[]> {
    const data = await this.prisma.eventJoin.findMany({
      where: {
        eventId,
        user: {
          deletedAt: null,
        },
      },
      select: {
        userId: true,
      },
    });

    return data.map((d) => d.userId);
  }

  async joinEvent(eventId: number, userId: number): Promise<void> {
    await this.prisma.eventJoin.create({
      data: {
        eventId,
        userId,
      },
    });
  }

  async leaveEvent(eventId: number, userId: number): Promise<void> {
    await this.prisma.eventJoin.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
  }

  async findEventDetailById(id: number): Promise<EventDetailData | null> {
    return this.prisma.event.findUnique({
      where: {
        id,
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
        clubId: true,
        isArchived: true,
        eventJoin: {
          where: {
            user: {
              deletedAt: null,
            },
          },
          select: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        review: {
          select: {
            id: true,
            userId: true,
            eventId: true,
            score: true,
            title: true,
            description: true,
          },
        },
      },
    });
  }

  async isUserInEvent(userId: number, eventId: number): Promise<boolean> {
    const result = await this.prisma.eventJoin.findUnique({
      where: {
        eventId_userId: {
          userId,
          eventId,
        },
      },
    });

    return !!result;
  }

  /* Club 관련 */
  async isUserInClub(userId: number, clubId: number): Promise<boolean> {
    const result = await this.prisma.clubJoin.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
        state: ClubJoinState.Accepted,
      },
    });

    return !!result;
  }

  async isUserClubOwner(userId: number, clubId: number): Promise<boolean> {
    const result = await this.prisma.club.findUnique({
      where: {
        id: clubId,
        ownerId: userId,
      },
    });

    return !!result;
  }
}
