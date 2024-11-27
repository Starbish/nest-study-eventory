import {
  Body,
  Post,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EventService } from './event.service';
import { EventDto, EventListDto } from './dto/event.dto';

import { CreateEventPayload } from './payload/create-event.payload';
import { SearchEventQuery } from './query/search-event.query';
import { EventInOutPayload } from './payload/event-inout.payload';
import { PatchEventPayload } from './payload/patch-event.payload';

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
      'hostId, cityId, categoryId 중 1개 이상을 입력하고, 그 조건에 맞는 모임 정보를 모두 가져옵니다.',
  })
  @ApiOkResponse({ type: EventListDto })
  async searchEventList(
    @Query() query: SearchEventQuery,
  ): Promise<EventListDto> {
    return this.eventService.searchEventList(query);
  }

  // #18
  @Post(':eventId/join')
  @ApiOperation({ summary: '유저를 event에 참여시킵니다.' })
  @ApiNoContentResponse()
  @HttpCode(204)
  async joinEvent(
    @Body() body: EventInOutPayload,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    await this.eventService.joinEvent(body.userId, eventId);
  }

  // #19
  @Post(':eventId/out')
  @ApiOperation({ summary: '유저를 event에서 내보냅니다.' })
  @ApiNoContentResponse()
  @HttpCode(204)
  async leftFromEvent(
    @Body() body: EventInOutPayload,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    await this.eventService.leftFromEvent(body.userId, eventId);
  }

  // #33
  @Patch(':eventId')
  @ApiOperation({ summary: '모임을 수정합니다.' })
  @ApiOkResponse({ type: EventDto })
  async patchEvent(
    @Body() body: PatchEventPayload,
    @Param('eventId') eventId: number,
  ): Promise<EventDto> {
    return await this.eventService.patchEvent(body, eventId);
  }

  // #34
  @Delete(':event')
  @ApiOperation({ summary: '모임을 삭제합니다.' })
  @ApiNoContentResponse()
  @HttpCode(204)
  async deleteEvent(@Param('event') eventId: number): Promise<void> {
    await this.eventService.deleteEvent(eventId);
  }
}
