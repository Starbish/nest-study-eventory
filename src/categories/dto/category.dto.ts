import { ApiProperty } from '@nestjs/swagger';
import { CategoryData } from '../type/category-data.type';

export class CategoryDto {
    @ApiProperty({
        description: "카테고리 ID",
        type: Number,
    })
    id!: number;

    @ApiProperty({
        description: "카테고리 이름 [(예시) 독서, 캠핑..]",
        type: String,
    })
    name!: string;

    static from(category: CategoryData): CategoryDto {
        return {
            id: category.id,
            name: category.name,
        };
    }
    
    static fromArray(categories: CategoryData[]): CategoryDto[] {
        return categories.map((element) => this.from(element));
    }
}

export class CategoryListDto {
    // CategoryDto[] 가 아닌 [CategoryDto]
    @ApiProperty({
        description: "카테고리 전체 목록",
        type: [CategoryDto],
    })
    categories!: CategoryDto[];

    static from(categories: CategoryData[]): CategoryListDto {
        return {
            categories: CategoryDto.fromArray(categories),
        };
    }
}