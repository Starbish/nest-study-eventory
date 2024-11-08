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
        await this.joinEvent(data.hostId, result.id, true);

        return result;
    }

    async joinEvent(
        userId: number, 
        eventId: number, 
        skipProcess: boolean = false
    ): Promise<boolean> {
        
        // 기본적인 검증을 모두 해줌
        // 사실상 createEvent() 밖에서 호출될 때 체크해야 할 것들을 모아둔 것
        if(!skipProcess) {
            if(!await this.findUserById(userId))
                throw new NotFoundException('해당 ID를 가진 유저가 존재하지 않습니다.');

            if(!await this.getEventTitleById(eventId))
                throw new NotFoundException('해당 ID를 가진 이벤트가 존재하지 않습니다.');

            // 이미 속해있는지 체크
            if(await this.hasUserJoined(userId, eventId, true))
                throw new ConflictException('해당 유저가 이미 모임에 속해 있습니다.');

            // 정원 초과 (지금 당장은 필요없어서 패스)
/*
            if(await this.getEventUserCount()) {

            }
*/
            // 
        }

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

    async hasUserJoined(
        userId: number, 
        eventId: number, 
        skipProcess: boolean = false
    ): Promise<boolean> {

        if(!skipProcess) {
            if(!await this.findUserById(userId))
                throw new NotFoundException('해당 ID를 가진 유저가 존재하지 않습니다.');

            if(!await this.getEventTitleById(eventId))
                throw new NotFoundException('해당 ID를 가진 이벤트가 존재하지 않습니다.');
        }
        
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
