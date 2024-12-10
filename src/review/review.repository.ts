import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateReviewData } from './type/create-review-data.type';
import { ReviewData } from './type/review-data.type';
import { User, Event, ClubJoinState } from '@prisma/client';
import { ReviewQuery } from './query/review.query';
import { UpdateReviewData } from './type/update-review-data.type';
import { EventData } from 'src/event/type/event-data.type';

@Injectable()
export class ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(data: CreateReviewData): Promise<ReviewData> {
    return this.prisma.review.create({
      data: {
        userId: data.userId,
        eventId: data.eventId,
        score: data.score,
        title: data.title,
        description: data.description,
      },
      select: {
        id: true,
        userId: true,
        eventId: true,
        score: true,
        title: true,
        description: true,
      },
    });
  }

  async getUserById(userId: number): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });
  }

  async getEventById(eventId: number): Promise<Event | null> {
    return this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });
  }

  async isReviewExist(userId: number, eventId: number): Promise<boolean> {
    const review = await this.prisma.review.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
        user: {
          deletedAt: null,
        },
      },
    });

    return !!review;
  }

  async isUserJoinedEvent(userId: number, eventId: number): Promise<boolean> {
    const event = await this.prisma.eventJoin.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
        user: {
          deletedAt: null,
        },
      },
    });

    return !!event;
  }

  async getReviewById(reviewId: number): Promise<ReviewData | null> {
    return this.prisma.review.findUnique({
      where: {
        id: reviewId,
      },
      select: {
        id: true,
        userId: true,
        eventId: true,
        score: true,
        title: true,
        description: true,
      },
    });
  }

  /*
    리뷰 조회에서 신경써야 할 건 크게 두 가지임.
    1. 클럽 전용 모임의 리뷰는 클럽 구성원들만 조회할 수 있다.
    2. 클럽 전용 모임 중에서 아카이브화 된 리뷰는 요청자의 클럽 가입 여부와는 무관하게, 현재 그 모임에 소속되어 있는지로 결정한다.
  */
  async getReviews(userId: number, query: ReviewQuery): Promise<ReviewData[]> {
    return this.prisma.review.findMany({
      where: {
        eventId: query.eventId,
        user: {
          deletedAt: null,
          id: query.userId,
        },
        // 아래의 코드를 다시 제대로 분류해보자.
        // 1. 아카이브된 (전) 클럽 전용 모임.
        // 2. 아카이브 되지 않은 (현) 클럽 전용 모임.
        // 3. 아카이브와는 전혀 무관한 개방 모임.
        event: {
          OR: [
            // 1. 아카이브된 (전) 클럽 전용 모임.
            // 현재 모임에 속해있는지 확인해야 한다.
            {
              isArchived: true,
              eventJoin: {
                some: {
                  userId: userId,
                },
              },
            },
            // 2. 아카이브 되지 않은 (현) 클럽 전용 모임.
            // 클럽에 속해있는지 확인해야 한다.
            {
              isArchived: false,
              clubId: { not: null },
              club: {
                clubJoin: {
                  some: {
                    userId,
                  },
                },
              },
            },
            // 3. 아카이브와는 전혀 무관한 개방 모임.
            {
              isArchived: false,
              clubId: null,
            },
          ],
        },
      },
      select: {
        id: true,
        userId: true,
        eventId: true,
        score: true,
        title: true,
        description: true,
      },
    });
  }

  async updateReview(
    reviewId: number,
    data: UpdateReviewData,
  ): Promise<ReviewData> {
    return this.prisma.review.update({
      where: {
        id: reviewId,
      },
      data: {
        score: data.score,
        title: data.title,
        description: data.description,
      },
      select: {
        id: true,
        userId: true,
        eventId: true,
        score: true,
        title: true,
        description: true,
      },
    });
  }

  async deleteReview(reviewId: number): Promise<void> {
    await this.prisma.review.delete({
      where: {
        id: reviewId,
      },
    });
  }

  async isUserInEvent(userId: number, eventId: number): Promise<boolean> {
    const result = await this.prisma.eventJoin.findUnique({
      where: {
        eventId_userId: {
          userId,
          eventId,
        },
      },
    });

    return !!result;
  }

  async isUserInClub(userId: number, clubId: number): Promise<boolean> {
    const result = await this.prisma.clubJoin.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
        state: ClubJoinState.Accepted,
      },
    });

    return !!result;
  }
}
