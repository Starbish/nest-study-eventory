import {
  Body,
  Post,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EventService } from './event.service';
import { EventDto, EventListDto } from './dto/event.dto';

import { CreateEventPayload } from './payload/create-event.payload';
import { SearchEventQuery } from './query/search-event.query';

@Controller('events')
@ApiTags('Event API')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // #14
  @Post()
  @ApiOperation({ summary: '새로운 모임을 추가합니다.' })
  @ApiCreatedResponse({ type: EventDto })
  async createEvent(@Body() payload: CreateEventPayload): Promise<EventDto> {
    return this.eventService.createEvent(payload);
  }

  // #16
  @Get(':eventId')
  @ApiOperation({ summary: '특정 id의 모임 데이터를 가져옵니다.' })
  @ApiOkResponse({ type: EventDto })
  async getEventById(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<EventDto> {
    return this.eventService.getEventById(eventId);
  }

  // #17
  @Get()
  @ApiOperation({
    summary:
      'hostId, cityId, categoryId 중 2개 이상을 입력하고, 그 조건에 맞는 모임 정보를 모두 가져옵니다.',
  })
  @ApiOkResponse({ type: EventListDto })
  async searchEventList(
    @Query() query: SearchEventQuery,
  ): Promise<EventListDto> {
    return this.eventService.searchEventList(query);
  }
}