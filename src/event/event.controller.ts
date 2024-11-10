import { Body, Post, Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventService } from './event.service';
import { EventDto } from './dto/event.dto';

// payloads
import { CreateEventPayload } from './payload/create-event.payload';

@Controller('events')
@ApiTags('Event API')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @ApiOperation({ summary: '새로운 모임을 추가합니다.' })
  @ApiCreatedResponse({ type: EventDto })
  async createEvent(@Body() payload: CreateEventPayload): Promise<EventDto> {
    return this.eventService.createEvent(payload);
  }

  @Get(":eventId")
  @ApiOperation({ summary: "특정 id의 모임 데이터를 가져옵니다." })
  @ApiOkResponse({ type: EventDto })
  async getEventById(
      @Param('eventId', ParseIntPipe) eventId: number, 
  ): Promise<EventDto> {
      return this.eventService.getEventById(eventId);
  }
}
