import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventRepository } from './event.repository';
import { EventDto, EventListDto } from './dto/event.dto';

import { CreateEventPayload } from './payload/create-event.payload';
import { CreateEventData } from './type/create-event-data.type';
import { SearchEventQuery } from './query/search-event.query';

@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async createEvent(payload: CreateEventPayload): Promise<EventDto> {
    // hostId 검증
    const user = await this.eventRepository.findUserById(payload.hostId);
    if (!user)
      throw new NotFoundException('입력한 호스트 ID가 존재하지 않습니다.');

    // categoryId 검증
    const category = await this.eventRepository.getCategoryById(
      payload.categoryId,
    );
    if (!category)
      throw new NotFoundException('입력한 카테고리 ID가 존재하지 않습니다.');

    // cityId 검증
    const city = await this.eventRepository.getCityById(payload.cityId);
    if (!city)
      throw new NotFoundException('입력한 도시 ID가 존재하지 않습니다.');

    // 시작 시각 > 종료 시각인 경우
    if (payload.startTime > payload.endTime)
      throw new ConflictException(
        '시작 시각이 종료 시각보다 뒤늦을 수 없습니다.',
      );

    // 시작 시각을 과거로 설정 불가능
    if (payload.startTime < new Date())
      throw new ConflictException(
        '시작 시각을 현재 시각보다 뒤로 설정할 수 없습니다.',
      );

    // 이미 존재하는 Event 인지도 확인하면 좋을 것 같은데,
    // spec에는 따로 없기도 하고 기준이 모호하므로 생략

    const data: CreateEventData = {
      hostId: payload.hostId,
      title: payload.title,
      description: payload.description,
      categoryId: payload.categoryId,
      cityId: payload.cityId,
      startTime: payload.startTime,
      endTime: payload.endTime,
      maxPeople: payload.maxPeople,
    };

    // Data로 바꾼 걸 db로 보냄
    const event = await this.eventRepository.createEvent(data);
    return EventDto.from(event);
  }

  async getEventById(eventId: number): Promise<EventDto> {
    const result = await this.eventRepository.getEventById(eventId);
    if (!result)
      throw new NotFoundException('해당 ID를 가진 모임이 존재하지 않습니다.');

    // EventDto로 래핑해서 보내준다.
    return EventDto.from(result);
  }

  async searchEventList(query: SearchEventQuery): Promise<EventListDto> {
    // hostId, cityId, categoryId 전부 반드시 받아야 하는 값이 아님.
    // prisma 에는 다행히도 undefined 값으로 검색할 경우 해당 필드를 검색 기준에서 제외함
    // 고로, 3개의 필드에 대해 각각의 값이 undefined가 아닌 경우 실제로 그 값이 유효한지 검증해야 함
    if (!query.hasEnoughParams())
      throw new BadRequestException(
        'Host ID, City ID, Category ID 중 적어도 2개 이상을 입력해야 합니다.',
      );

    if (
      query.hostId !== undefined &&
      !(await this.eventRepository.findUserById(query.hostId))
    )
      throw new NotFoundException('해당 ID를 가진 유저가 존재하지 않습니다.');

    if (
      query.cityId !== undefined &&
      !(await this.eventRepository.getCityById(query.cityId))
    )
      throw new NotFoundException('입력한 도시 ID가 존재하지 않습니다.');

    if (
      query.categoryId !== undefined &&
      !(await this.eventRepository.getCategoryById(query.categoryId))
    )
      throw new NotFoundException('입력한 카테고리 ID가 존재하지 않습니다.');

    return this.eventRepository.searchEventList(query);
  }

  async joinEvent(userId: number, eventId: number): Promise<void> {
    const event = await this.eventRepository.getEventById(eventId);
    if (!event)
      throw new NotFoundException('해당 ID를 가진 모임이 존재하지 않습니다.');

    if (!(await this.eventRepository.findUserById(userId)))
      throw new NotFoundException('해당 ID를 가진 유저가 존재하지 않습니다.');

    if (await this.eventRepository.hasUserJoined(userId, eventId))
      throw new ConflictException('해당 유저가 이미 모임에 속해 있습니다.');

    // 모임 자체가 이 시점에서 유효한지도 확인해야 함.
    // 사실 아래만 해도 되지만, 더 자세한 정보를 제공함
    if (event.endTime < new Date())
      throw new ConflictException('이미 종료된 모임에 참여할 수 없습니다.');

    // 모임 시작 전까지만 참여가 가능함.
    if (event.startTime > new Date())
      throw new ConflictException('이미 시작된 모임에 참여할 수 없습니다.');

    if (
      event.maxPeople ===
      (await this.eventRepository.getParticipantsCount(eventId))
    )
      throw new ConflictException('해당 모임의 정원이 다 찼습니다.');

    this.eventRepository.joinEvent(userId, eventId);
  }

  async leftFromEvent(userId: number, eventId: number): Promise<void> {
    const event = await this.eventRepository.getEventById(eventId);
    if (!event)
      throw new NotFoundException('해당 ID를 가진 모임이 존재하지 않습니다.');

    if (!(await this.eventRepository.findUserById(userId)))
      throw new NotFoundException('해당 ID를 가진 유저가 존재하지 않습니다.');

    if (!(await this.eventRepository.hasUserJoined(userId, eventId)))
      throw new ConflictException('해당 유저가 모임에 속해 있지 않습니다.');

    // 모임 자체가 이 시점에서 유효한지도 확인해야 함.
    // 사실 아래만 해도 되지만, 더 자세한 정보를 제공함
    if (event.endTime < new Date())
      throw new ConflictException('이미 종료된 모임에서 탈퇴할 수 없습니다.');

    // 모임 시작 전까지만 참여가 가능함.
    if (event.startTime > new Date())
      throw new ConflictException('이미 시작된 모임에서 탈퇴할 수 없습니다.');

    this.eventRepository.leftFromEvent(userId, eventId);
  }

  async hasUserJoined(userId: number, eventId: number): Promise<boolean> {
    if (!(await this.eventRepository.findUserById(userId)))
      throw new NotFoundException('해당 ID를 가진 유저가 존재하지 않습니다.');

    if (!(await this.eventRepository.getEventById(eventId)))
      throw new NotFoundException('해당 ID를 가진 모임이 존재하지 않습니다.');

    return this.eventRepository.hasUserJoined(userId, eventId);
  }
}
