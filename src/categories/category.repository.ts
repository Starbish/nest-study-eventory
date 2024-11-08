import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CategoryData } from './type/category-data.type';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllCategories(): Promise<CategoryData[]> {
    return this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }
}
