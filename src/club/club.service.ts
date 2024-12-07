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

    const result = await this.clubRepository.createClub(user, data);
    return ClubInfoDto.from(result);
  }
}
