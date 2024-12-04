import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClubService } from './club.service';
import { ClubInfoDto } from './dto/club-info.dto';

@Controller('clubs')
@ApiTags('Club API')
export class ClubController {
    constructor(private readonly clubService: ClubService) {}

    @Get(':clubId')
    @ApiOperation({ summary: '클럽 정보를 조회합니다.' })
    @ApiOkResponse({ type: ClubInfoDto })
    async getClubInfo(
        @Param('clubId', ParseIntPipe) clubId: number,
    ) : Promise<ClubInfoDto> {
        return this.clubService.getClubInfo(clubId);
    }
}
