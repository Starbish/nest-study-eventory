import {
  Body,
  Controller,
  Delete,
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
import { ClubInfoDto } from './dto/club-info.dto copy';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { CreateClubPayload } from './payload/create-club.payload';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { PatchClubPayload } from './payload/patch-club.payload';
import { RespondClubApplicationPayload } from './payload/respond-club-application.payload';
import { DelegateClubOwnerPayload } from './payload/delegate-club-owner.payload copy';
import { UserDto } from 'src/user/dto/user.dto';

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
  @ApiOperation({ summary: '클럽에 참가를 신청합니다.' })
  @ApiNoContentResponse()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async joinClub(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.clubService.joinClub(user, clubId);
  }

  // feat/5
  @Delete(':clubId/leave')
  @ApiOperation({ summary: '클럽을 탈퇴합니다.' })
  @ApiNoContentResponse()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async leaveClub(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.clubService.leaveClub(user, clubId);
  }

  // feat/7
  @Post(':clubId/delegate')
  @ApiOperation({ summary: '클럽장을 다른 구성원에게 위임합니다.' })
  @ApiNoContentResponse()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async delegateClubOwner(
    @Param('clubId', ParseIntPipe) clubId: number,
    @Body() payload: DelegateClubOwnerPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.clubService.delegateClubOwner(user, clubId, payload);
  }

  // feat/7
  @Post(':clubId/join/:joinId')
  @ApiOperation({ summary: '클럽장이 클럽 가입 신청을 승인/거절합니다.' })
  @ApiNoContentResponse()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async respondClubApplication(
    @Param('clubId', ParseIntPipe) clubId: number,
    @Param('joinId', ParseIntPipe) joinId: number,
    @Body() payload: RespondClubApplicationPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.clubService.respondClubApplication(
      user,
      clubId,
      joinId,
      payload,
    );
  }

  // feat/7
  @Delete(':clubId')
  @ApiOperation({ summary: '클럽을 해체합니다.' })
  @ApiNoContentResponse()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async disbandClub(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.clubService.disbandClub(user, clubId);
  }

  // feat/7
  @Get(':clubId/join')
  @ApiOperation({ summary: '클럽 가입을 신청한 유저들 명단을 조회합니다.' })
  @ApiOkResponse({ type: ClubInfoDto })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getClubApplicationList(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<UserDto[]> {
    return this.clubService.getClubApplicationList(user, clubId);
  }
}
