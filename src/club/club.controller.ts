import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ClubService } from './club.service';
import { ClubInfoDto } from './dto/club-info.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { CreateClubPayload } from './payload/create-club.payload';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';

@Controller('clubs')
@ApiTags('Club API')
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Get(':clubId')
  @ApiOperation({ summary: '클럽 정보를 조회합니다.' })
  @ApiOkResponse({ type: ClubInfoDto })
  async getClubInfo(
    @Param('clubId', ParseIntPipe) clubId: number,
  ): Promise<ClubInfoDto> {
    return this.clubService.getClubInfo(clubId);
  }

  @Post()
  @ApiOperation({ summary: '클럽을 생성합니다.' })
  @ApiCreatedResponse({ type: ClubInfoDto })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createClub(
    @Body() payload: CreateClubPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<ClubInfoDto> {
    return this.clubService.createClub(user, payload);
  }
}
