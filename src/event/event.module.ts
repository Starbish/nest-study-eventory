import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { EventRepository } from './event.repository';

@Module({
  providers: [EventService, EventRepository],
  controllers: [EventController]
})
export class EventModule {}
