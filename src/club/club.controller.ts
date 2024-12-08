import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
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
import { PatchClubPayload } from './payload/patch-club.payload';

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

  // feat/2
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

  // feat/3
  @Patch(':clubId')
  @ApiOperation({ summary: '클럽 정보를 수정합니다.' })
  @ApiOkResponse({ type: ClubInfoDto })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async patchClub(
    @Param('clubId', ParseIntPipe) clubId: number,
    @Body() payload: PatchClubPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<ClubInfoDto> {
    return this.clubService.patchClub(user, clubId, payload);
  }

  // feat/4
  @Post(':clubId/join')
  @ApiOperation({ summary: '클럽에 참가를 신청합니다. ' })
  @ApiNoContentResponse()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async joinClub(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.clubService.joinClub(user, clubId);
  }
}
