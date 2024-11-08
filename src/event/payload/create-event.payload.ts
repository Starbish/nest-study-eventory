import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, IsDate, Min, IsDateString, } from 'class-validator';

// 멤버변수 뒤에 !를 붙여주는 건 이후에 반드시 초기화되는 대상이라는 걸 명시하는 것
export class CreateEventPayload {
    @IsInt()
    @Min(1)
    @ApiProperty({
        description: '호스트 유저 ID',
        type: Number,
    })
    hostId!: number;

    @IsString()
    @ApiProperty({
        description: '모임 제목',
        type: String,
    })
    title!: string;

    @IsString()
    @ApiProperty({
        description: '모임 설명(내용)',
        type: String,
    })
    description!: string;

    @IsInt()
    @Min(1)
    @ApiProperty({
        description: '카테고리 ID',
        type: Number,
    })
    categoryId!: number;

    @IsInt()
    @Min(1)
    @ApiProperty({
        description: '지역 ID',
        type: Number,
    })
    cityId!: number;
    
    @IsDate()
    @Type(() => Date)
    @ApiProperty({
        description: '모임 시작 시각',
        type: Date,
    })
    startTime!: Date;

    @IsDate()
    @Type(() => Date)
    @ApiProperty({
        description: '모임 종료 시각',
        type: Date,
    })
    endTime!: Date;

    @IsInt()
    @Min(2)
    @ApiProperty({
        description: '모임 최대 정원 (주최자 포함)',
        type: Number,
    })
    maxPeople!: number;
};