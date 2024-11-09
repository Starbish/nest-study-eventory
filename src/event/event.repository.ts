import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { EventDto } from './dto/event.dto';
import { CreateEventData } from './type/create-event-data.type';
import { EventData } from './type/event-data.type';

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

        // 데이터를 db에 저장하고 그 결과를 받아온 후, 이걸 이용해서 host에 JoinEvent 처리를 해줌
        await this.joinEvent(data.hostId, result.id);
        return result;
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
/*
    async getEventUserCount(eventId: number): Promise<number> {
        return this.prisma.event.count({
            where: {

            }
        });
    }
*/

    async hasUserJoined(userId: number, eventId: number): Promise<boolean> {
        const result = await this.prisma.eventJoin.findUnique({
            where: {
                id: userId,
                eventId: eventId,
            },
            select: {
                id: true,
            }
        });
        
        return !!result;
    }
    
    // hostId 검증
    async findUserById(id: number): Promise<{ id: number } | null> {
        return this.prisma.user.findUnique({
            where: {
                id: id,
            },
        });
    }

    // categoryId 
    async getCategoryNameById(id: number): Promise<{ name: string } | null> {
        return this.prisma.category.findUnique({
            where: {
                id: id,
            },
            select: {
                name: true,
            },
        });
    }
    
    // cityId
    async getCityNameById(id: number): Promise<{ name: string } | null> {
        return this.prisma.city.findUnique({
            where: {
                id: id,
            },
            select: {
                name: true,
            },
        });
    }

    // eventId
    async getEventTitleById(id: number): Promise<{ title: string } | null> {
        return this.prisma.event.findUnique({
            where: {
                id: id,
            },
            select: {
                title: true,
            },
        });
    }
}
