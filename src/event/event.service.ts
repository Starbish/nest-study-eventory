import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventRepository } from './event.repository';
import { EventDto } from './dto/event.dto';

import { CreateEventPayload } from './payload/create-event.payload';
import { CreateEventData } from './type/create-event-data.type';

@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async createEvent(payload: CreateEventPayload): Promise<EventDto> {
    // hostId 검증
    const userId = await this.eventRepository.findUserById(payload.hostId);
    if (!userId)
      throw new NotFoundException('입력한 호스트 ID가 존재하지 않습니다.');

    // categoryId 검증
    const categoryName = await this.eventRepository.getCategoryNameById(
      payload.categoryId,
    );
    if (!categoryName)
      throw new NotFoundException('입력한 카테고리 ID가 존재하지 않습니다.');

    // cityId 검증
    const cityName = await this.eventRepository.getCityNameById(
      payload.categoryId,
    );
    if (!cityName)
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

    // 위 과정을 모두 거쳤다면 CreateEventData로 바꿈
    // 굳이 이 과정이 필요한가?
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
}
