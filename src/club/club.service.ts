import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClubInfoDto } from './dto/club-info.dto';
import { ClubRepository } from './club.repository';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { CreateClubPayload } from './payload/create-club.payload';
import { CreateClubData } from './type/create-club-data.type';
import { PatchClubPayload } from './payload/patch-club.payload';
import { UpdateClubData } from './type/update-club-data.type';
import { ClubJoinState } from '@prisma/client';
import { RespondClubApplicationPayload } from './payload/respond-club-application.payload';
import { DelegateClubOwnerPayload } from './payload/delegate-club-owner.payload copy';

@Injectable()
export class ClubService {
  constructor(private readonly clubRepository: ClubRepository) {}

  async getClubInfo(clubId: number): Promise<ClubInfoDto> {
    const club = await this.clubRepository.getClubInfo(clubId);

    if (!club) throw new NotFoundException('존재하지 않는 클럽 ID입니다.');

    // repo의 data와 service 이후의 dto는 구분할 것
    return ClubInfoDto.from(club);
  }

  async createClub(
    user: UserBaseInfo,
    payload: CreateClubPayload,
  ): Promise<ClubInfoDto> {
    // 이미 존재하는 클럽인지 확인함
    const exist = await this.clubRepository.findClubByTitle(payload.title);
    if (exist)
      throw new ConflictException('중복된 이름의 클럽이 이미 존재합니다.');

    // repo로 보내기 전에 데이터 묶어주기
    const data: CreateClubData = {
      ownerId: payload.ownerId,
      title: payload.title,
      description: payload.description,
    };

    const result = await this.clubRepository.createClub(user.id, data);
    return ClubInfoDto.from(result);
  }

  async patchClub(
    user: UserBaseInfo,
    clubId: number,
    payload: PatchClubPayload,
  ): Promise<ClubInfoDto> {
    const club = await this.clubRepository.findClubByIndex(clubId);
    if (!club) throw new NotFoundException('존재하지 않는 클럽 ID입니다.');

    if (club.ownerId != user.id)
      throw new ConflictException('클럽장만 클럽 정보를 수정할 수 있습니다.');

    const data: UpdateClubData = {
      title: payload.title,
      description: payload.description,
    };

    const result = await this.clubRepository.updateClubInfo(clubId, data);
    return ClubInfoDto.from(result);
  }

  async joinClub(user: UserBaseInfo, clubId: number): Promise<void> {
    const club = await this.clubRepository.findClubByIndex(clubId);
    if (!club) throw new NotFoundException('존재하지 않는 클럽 ID입니다.');

    const clubJoin = await this.clubRepository.getUserClubJoinData(
      user.id,
      clubId,
    );
    if (clubJoin?.state === ClubJoinState.Accepted)
      throw new ConflictException('이미 가입한 클럽입니다.');
    else if (clubJoin?.state === ClubJoinState.Applied)
      throw new ConflictException('이미 가입 신청한 클럽입니다.');

    await this.clubRepository.joinClub(user.id, clubId);
  }

  async leaveClub(user: UserBaseInfo, clubId: number): Promise<void> {
    const club = await this.clubRepository.findClubByIndex(clubId);
    if (!club) throw new NotFoundException('존재하지 않는 클럽 ID입니다.');

    const clubJoin = await this.clubRepository.getUserClubJoinData(
      user.id,
      clubId,
    );
    if (!clubJoin || clubJoin.state !== ClubJoinState.Accepted)
      throw new ConflictException(
        '클럽에 속해있지 않거나, 아직 가입 신청하지 않은 클럽입니다.',
      );

    if (user.id === club.ownerId)
      throw new ConflictException('클럽장은 클럽에서 탈퇴할 수 없습니다.');

    // club의 user와 관련된 모든 데이터를 지운다.
    await this.clubRepository.leaveClub(user.id, clubId);
  }

  async delegateClubOwner(
    user: UserBaseInfo,
    clubId: number,
    payload: DelegateClubOwnerPayload,
  ): Promise<void> {
    const club = await this.clubRepository.findClubByIndex(clubId);
    if (!club) throw new NotFoundException('존재하지 않는 클럽 ID입니다.');

    // 이 API를 호출한 유저가 클럽 owner인지 확인
    if (user.id !== club.ownerId)
      throw new ForbiddenException(
        '클럽장만 다른 구성원에게 클럽장을 승계할 수 있습니다.',
      );

    // 승계받을 유저가 클럽 구성원인지 확인
    const clubJoin = await this.clubRepository.getUserClubJoinData(
      user.id,
      clubId,
    );
    if (!clubJoin || clubJoin.state !== ClubJoinState.Accepted)
      throw new ConflictException('승계받을 유저가 클럽 구성원이 아닙니다.');

    // 모든 예외사항을 통과했다면, club row의 ownerId만 바꿔주면 됨.
    await this.clubRepository.delegateClubOwner(clubId, user.id);
  }

  async respondClubApplication(
    user: UserBaseInfo,
    clubId: number,
    joinId: number,
    payload: RespondClubApplicationPayload,
  ): Promise<void> {
    const club = await this.clubRepository.findClubByIndex(clubId);
    if (!club) throw new NotFoundException('존재하지 않는 클럽 ID입니다.');

    // 이 API를 호출한 유저가 클럽 owner인지 확인
    if (user.id !== club.ownerId)
      throw new ForbiddenException(
        '클럽장만 클럽 가입을 승인/거절할 수 있습니다.',
      );

    // 신청한 clubJoin이 이 클럽에 해당하는지 확인
    const clubJoin = await this.clubRepository.getClubJoinFromId(joinId);
    if (!clubJoin)
      throw new NotFoundException(
        '해당 유저가 클럽 가입 신청한 이력이 없습니다.',
      );

    if (clubJoin.clubId !== clubId)
      throw new ConflictException(
        '클럽 가입 신청의 클럽과 입력한 클럽 ID가 일치하지 않습니다.',
      );

    await this.clubRepository.respondClubApplication(
      clubJoin.userId,
      clubId,
      payload.decision,
    );
  }

  async disbandClub(user: UserBaseInfo, clubId: number): Promise<void> {
    const club = await this.clubRepository.findClubByIndex(clubId);
    if (!club) throw new NotFoundException('존재하지 않는 클럽 ID입니다.');

    // 이 API를 호출한 유저가 클럽 owner인지 확인
    if (user.id !== club.ownerId)
      throw new ForbiddenException(
        '클럽장만 클럽 가입을 승인/거절할 수 있습니다.',
      );
  }
}
