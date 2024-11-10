import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RegionData } from './type/region-data.type';

@Injectable()
export class RegionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllRegions(): Promise<RegionData[]> {
    return this.prisma.region.findMany({
      select: {
        id: true,
        name: true,
        //        city: true,
      },
    });
  }
}
