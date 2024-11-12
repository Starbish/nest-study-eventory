import { Injectable } from '@nestjs/common';
import { Category, City, Event, User } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { EventDto, EventListDto } from './dto/event.dto';
import { SearchEventQuery } from './query/search-event.query';
import { CreateEventData } from './type/create-event-data.type';
import { EventData } from './type/event-data.type';
import { PatchEventData } from './type/patch-event-data.type';

@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(data: CreateEventData): Promise<EventData> {
    const result = await this.prisma.event.create({
      data: {
        hostId: data.hostId,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        cityId: data.cityId,
        startTime: data.startTime,
        endTime: data.endTime,
        maxPeople: data.maxPeople,
        eventJoin: {
          create: {
            // 이런식으로 relation 이 있는 경우에는
            // 그걸 매개해주는 필드는 입력하지 않아도 됨 (이 경우는 eventId)
            // Event에 테이블을 insert,
            // 그 테이블과 연관된 EventJoin 에도 insert
            // 이 두 과정을 transaction 으로 보내주는 기능
            // 둘 다 성공하거나, 둘 다 실패하는 경우밖에 없으므로 db 정합성 유지
            userId: data.hostId,
          },
        },
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        cityId: true,
        startTime: true,
        endTime: true,
        maxPeople: true,
      },
    });

    return result;
  }

  async getEventById(id: number): Promise<EventData | null> {
    return this.prisma.event.findUnique({
      where: {
        id: id,
      },
    });
  }

  async searchEventList(query: SearchEventQuery): Promise<EventListDto> {
    const data = await this.prisma.event.findMany({
      where: {
        hostId: query.hostId,
        cityId: query.cityId,
        categoryId: query.categoryId,
      },
    });

    return EventListDto.from(data);
  }

  async joinEvent(userId: number, eventId: number): Promise<boolean> {
    const result = await this.prisma.eventJoin.create({
      data: {
        userId: userId,
        eventId: eventId,
      },
    });
    return !!result;
  }

  async leftFromEvent(userId: number, eventId: number): Promise<void> {
    const result = await this.prisma.eventJoin.delete({
      where: {
        eventId_userId: {
          userId: userId,
          eventId: eventId,
        },
      },
    });
  }

  async patchEvent(data: PatchEventData, eventId: number): Promise<EventData> {
    return this.prisma.event.update({
      where: {
        id: eventId,
      },
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        cityId: data.cityId,
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
        cityId: true,
        startTime: true,
        endTime: true,
        maxPeople: true,
      },
    });
  }

  async deleteEvent(eventId: number): Promise<void> {
    await this.prisma.event.delete({
      where: {
        id: eventId,
      },
    });
  }

  async hasUserJoined(userId: number, eventId: number): Promise<boolean> {
    const result = await this.prisma.eventJoin.findUnique({
      where: {
        eventId_userId: {
          userId: userId,
          eventId: eventId,
        },
        // Soft delete 구현
        user: {
          deletedAt: null,
        }
      },
      select: {
        id: true,
      },
    });

    return !!result;
  }

  async findUserById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        // 삭제되지 않은 아이디에 한해 검색함
        id: id,
        deletedAt: null,
      },
    });
  }

  async getCategoryById(id: number): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: {
        id: id,
      },
    });
  }

  async getCityById(id: number): Promise<City | null> {
    return this.prisma.city.findUnique({
      where: {
        id: id,
      },
    });
  }

  async getParticipantsCount(eventId: number): Promise<number> {
    return await this.prisma.eventJoin.count({
      where: {
        eventId: eventId,
        user: {
          deletedAt: null,
        }
      },
    });
  }
}
