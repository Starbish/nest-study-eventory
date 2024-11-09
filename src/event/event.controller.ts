import { Body, Post, Controller } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventService } from './event.service';
import { EventDto } from './dto/event.dto';

// payloads
import { CreateEventPayload } from './payload/create-event.payload';

@Controller('events')
@ApiTags('Event API')
export class EventController {
    constructor(private readonly eventService: EventService) {}

    @Post()
    @ApiOperation({ summary: "새로운 모임을 추가합니다." })
    @ApiCreatedResponse({ type: EventDto })
    async createEvent(@Body() payload: CreateEventPayload): Promise<EventDto> {
        return this.eventService.createEvent(payload);
    }
}
