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
    const event = await this.clubRepository.findClubByIndex(clubId);

    if (!event) throw new NotFoundException('클럽이 존재하지 않습니다.');

    if (event.ownerId != user.id)
      throw new ConflictException('클럽장만 클럽 정보를 수정할 수 있습니다.');

    const data: UpdateClubData = {
      title: payload.title,
      description: payload.description,
    };

    const result = await this.clubRepository.updateClubInfo(clubId, data);
    return ClubInfoDto.from(result);
  }

  async joinClub(
    user: UserBaseInfo,
    clubId: number,
  ): Promise<void> {
    const joinState = await this.clubRepository.getUserJoinState(user.id);
    // 이렇게 enum 값을 하드 코딩하는 것보다, enum을 직접 사용하는 게 더 나은 방법같은데 방법을 잘 모르겠습니다.
    // Prisma Client 를 가지고 오면 해결되긴 하는데, repository와 분리한 목적이 사라지는 것 같고,
    // 이렇게 하드 코딩하게 되면 유지보수 측면에서 아쉽습니다..
    // 더 나은 방법이 있을까요?
    if(joinState?.state === "Accepted")
      throw new ConflictException("이미 가입한 클럽입니다.")
    
    else if(joinState?.state === "Applied")
      throw new ConflictException("이미 가입 신청한 클럽입니다.");

    const club = await this.clubRepository.findClubByIndex(clubId);
    if(!club)
      throw new NotFoundException("존재하지 않는 클럽 ID입니다.");

    await this.clubRepository.joinClub(user.id, clubId);
  }
}
