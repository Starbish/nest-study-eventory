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
import { PatchEventPayload } from './payload/patch-event.payload';
import { UpdateEventData } from './type/update-event-data.type';
import { EventData } from './type/event-data.type';

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
        'Host ID, City ID, Category ID 중 적어도 1개 이상을 입력해야 합니다.',
      );

    const data: EventData[] = await this.eventRepository.searchEventList(query);
    return EventListDto.from(data);
  }

  async joinEvent(userId: number, eventId: number): Promise<void> {
    const event = await this.eventRepository.getEventById(eventId);
    if (!event)
      throw new NotFoundException('해당 ID를 가진 모임이 존재하지 않습니다.');

    const user = await this.eventRepository.findUserById(userId);
    if (!user)
      throw new NotFoundException('해당 ID를 가진 유저가 존재하지 않습니다.');

    const isJoined = await this.eventRepository.hasUserJoined(userId, eventId);
    if (isJoined)
      throw new ConflictException('해당 유저가 이미 모임에 속해 있습니다.');

    // 모임 자체가 이 시점에서 유효한지도 확인해야 함.
    // 사실 아래만 해도 되지만, 더 자세한 정보를 제공함
    if (event.endTime < new Date())
      throw new ConflictException('이미 종료된 모임에 참여할 수 없습니다.');

    // 모임 시작 전까지만 참여가 가능함.
    if (event.startTime < new Date())
      throw new ConflictException('이미 시작된 모임에 참여할 수 없습니다.');

    const count = await this.eventRepository.getParticipantsCount(eventId);
    if (event.maxPeople === count)
      throw new ConflictException('해당 모임의 정원이 다 찼습니다.');

    await this.eventRepository.joinEvent(userId, eventId);
  }

  async leftFromEvent(userId: number, eventId: number): Promise<void> {
    const event = await this.eventRepository.getEventById(eventId);
    if (!event)
      throw new NotFoundException('해당 ID를 가진 모임이 존재하지 않습니다.');

    const user = await this.eventRepository.findUserById(userId);
    if (!user)
      throw new NotFoundException('해당 ID를 가진 유저가 존재하지 않습니다.');

    const isJoined = await this.eventRepository.hasUserJoined(userId, eventId);
    if (!isJoined)
      throw new ConflictException('해당 유저가 모임에 속해 있지 않습니다.');

    // 모임 자체가 이 시점에서 유효한지도 확인해야 함.
    // 사실 아래만 해도 되지만, 더 자세한 정보를 제공함
    if (event.endTime < new Date())
      throw new ConflictException('이미 종료된 모임에서 탈퇴할 수 없습니다.');

    // 모임 시작 전까지만 참여가 가능함.
    if (event.startTime < new Date())
      throw new ConflictException('이미 시작된 모임에서 탈퇴할 수 없습니다.');

    // 주최자(host)는 나갈 수 없는 기능
    if (event.hostId === userId)
      throw new ConflictException('주최자는 모임에서 나갈 수 없습니다.');

    await this.eventRepository.leftFromEvent(userId, eventId);
  }

  async patchEvent(
    body: PatchEventPayload,
    eventId: number,
  ): Promise<EventDto> {
    const prevEvent = await this.getEventById(eventId);
    if (!prevEvent)
      throw new NotFoundException('해당 ID를 가진 모임이 존재하지 않습니다.');

    // Event 수정은 시작 전까지만 가능함.
    if (prevEvent.endTime < new Date())
      throw new ConflictException('종료된 모임은 정보를 변경할 수 없습니다.');

    if (prevEvent.startTime < new Date())
      throw new ConflictException('진행중인 모임은 정보를 변경할 수 없습니다.');

    // 변경할 카테고리, 도시가 실제로 db상에 존재하는지를 확인해야 함.
    // 어찌 보면 일종의 event (재)생성이므로 createEvent() 의 예외처리를 참고할 필요가 있다.
    if (
      body.categoryId !== undefined &&
      !(await this.eventRepository.getCategoryById(body.categoryId))
    )
      throw new NotFoundException('입력한 카테고리 ID가 존재하지 않습니다.');

    if (
      body.cityId !== undefined &&
      !(await this.eventRepository.getCityById(body.cityId))
    )
      throw new NotFoundException('입력한 도시 ID가 존재하지 않습니다.');

    // startTime과 endTime에 대한 검증이 필요함.
    // 변경할 startTime, endTime가 논리적으로 가능한 조합인지를 확인해야 함.
    // 네 가지 케이스에 대해 각각을 예외처리 해주어야 함...
    // startTime, endTime이 바뀌면 O, 바뀌지 않으면(undefined) X
    // O O
    // 바뀐 startTime, endTime이 서로 모순되지 않는지 확인
    // O X
    // 비뀐 startTime과 기존의 endTime이 모순되지 않는지 확인
    // X O
    // 바뀐 endTime과 기존의 startTime이 모순되지 않는지 확인
    // X X
    // 처리 필요 없음

    // 음... 각각의 케이스로 처리하는 것도 좋지만 아래의 방법이 조금 더 현명한 방법인듯
    const startTime =
      body.startTime !== undefined ? body.startTime : prevEvent.startTime;
    const endTime =
      body.endTime !== undefined ? body.endTime : prevEvent.endTime;
    if (startTime > endTime)
      throw new ConflictException(
        '시작 시각이 종료 시각보다 뒤늦을 수 없습니다.',
      );

    // startTime 을 현재보다 과거로 설정해 지금 모임이 시작중인 상태로 변경하는 것을 방지함
    if (startTime < new Date())
      throw new ConflictException(
        '시작 시각을 현재 시각보다 뒤로 설정할 수 없습니다.',
      );

    // Event 정보는 hostId 만 수정할 수 있는 부분은 어떻게 구현?
    // 조금 애매함

    // 이전보다 maxPeople 값이 작아질 경우, 현재 정원과 비교해서 가능한지 확인해야 함.
    if (body.maxPeople !== undefined)
      if (
        body.maxPeople <
        (await this.eventRepository.getParticipantsCount(eventId))
      )
        throw new ConflictException(
          '모임 최대 정원은 현재 참가 인원보다 크거나 같아야 합니다.',
        );

    const data: UpdateEventData = {
      title: body.title,
      description: body.description,
      categoryId: body.categoryId,
      cityId: body.cityId,
      startTime: body.startTime,
      endTime: body.endTime,
      maxPeople: body.maxPeople,
    };

    const updated = await this.eventRepository.updateEvent(data, eventId);
    return EventDto.from(updated);
  }

  async deleteEvent(eventId: number): Promise<void> {
    const event = await this.eventRepository.getEventById(eventId);
    if (!event)
      throw new NotFoundException('해당 ID를 가진 모임이 존재하지 않습니다.');

    if (event.endTime < new Date())
      throw new ConflictException('종료된 모임은 삭제할 수 없습니다.');

    // Event 수정은 시작 전까지만 가능함.
    if (event.startTime < new Date())
      throw new ConflictException('진행중인 모임은 삭제할 수 없습니다.');

    await this.eventRepository.deleteEvent(eventId);
  }
  /*
  async hasUserJoined(userId: number, eventId: number): Promise<boolean> {
    if (!(await this.eventRepository.findUserById(userId)))
      throw new NotFoundException('해당 ID를 가진 유저가 존재하지 않습니다.');

    if (!(await this.eventRepository.getEventById(eventId)))
      throw new NotFoundException('해당 ID를 가진 모임이 존재하지 않습니다.');

    return this.eventRepository.hasUserJoined(userId, eventId);
  }
*/
}
