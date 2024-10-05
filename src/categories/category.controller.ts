import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CategoryListDto } from './dto/category.dto';

@Controller('categories')
@ApiTags('Category API')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOkResponse({ type: CategoryListDto })
    @Get()
    @ApiOperation({ summary: '전체 카테고리를 조회합니다.' })
    @ApiOkResponse({ type: CategoryListDto })
    async findAllCategories(): Promise<CategoryListDto> {
        return this.categoryService.findAllCategories();
    }
}
