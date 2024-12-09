import {
  ConflictException,
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
import { EventListDto } from 'src/event/dto/event.dto';
import { EventData } from 'src/event/type/event-data.type';
import { LeaveClubData, LeaveClubEventAction } from './type/leave-club-data.type';

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

    const joinState = await this.clubRepository.getUserJoinState(user.id);
    if (joinState?.state === ClubJoinState.Accepted)
      throw new ConflictException('이미 가입한 클럽입니다.');
    else if (joinState?.state === ClubJoinState.Applied)
      throw new ConflictException('이미 가입 신청한 클럽입니다.');

    await this.clubRepository.joinClub(user.id, clubId);
  }

  async leaveClub(user: UserBaseInfo, clubId: number): Promise<void> {
    const club = await this.clubRepository.findClubByIndex(clubId);
    if (!club) throw new NotFoundException('존재하지 않는 클럽 ID입니다.');

    const joinState = await this.clubRepository.getUserJoinState(user.id);
    // Accepted 상태이든, Applied 상태이든 결국 할 것은 row를 삭제하는 것
    if (!joinState)
      throw new NotFoundException(
        '클럽에 속해있지 않거나, 아직 가입 신청하지 않은 클럽입니다.',
      );

    if (user.id === club.ownerId)
      throw new ConflictException('클럽장은 클럽에서 탈퇴할 수 없습니다.');

    // 클럽 전용 모임에 가입된 상태라면, 그 모임을 모두 불러온다
    const list: EventData[] = await this.clubRepository.getUserClubEvents(
      user.id,
      clubId,
    );

    // 탈퇴하려는 클럽의 전용 모임에 가입한 게 있는 경우
    // 아직 시작하지 않은 모임에 대해서만 탈퇴 및 해체 처리를 진행한다.
    const tasks: LeaveClubData[] = list
      .filter((event) => event.startTime > new Date())
      .map((event) => {
        // 클럽을 탈퇴하려는 유저가 해당 모임의 호스트인 경우
        // 모임이 아직 시작하지 않았으므로 해체한다.
        if(event.hostId === user.id) {
          return {
            eventId: event.id,
            action: LeaveClubEventAction.LeaveAndDisband,
          }
        // 모임 호스트가 아닌 경우에는 그냥 탈퇴하고 나온다.
        } else {
          return {
            eventId: event.id,
            action: LeaveClubEventAction.Leave,
          }
        }
      });

    // clubJoin row 삭제
    await this.clubRepository.leaveClub(user.id, tasks, clubId);
  }
}
