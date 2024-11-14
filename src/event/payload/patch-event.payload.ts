import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { ValidationOptions } from 'joi';

// https://stackoverflow.com/questions/55571773/validation-on-optional-parameter-using-class-validator-in-nestjs
// ValidateIf 에 조건으로 걸려있는 함수가 
// true일 때는 모든 decorator 작동,
// false일 때는 모든 decorator 를 무시함.
// 즉, 필드가 undefined 일때는 모든 데코레이터를 무시하므로 수용,
// 필드가 null 일때는 데코레이터를 거치므로 다른 데코레이터에 의해 필터되고,
// 두 경우가 다 아닌 경우는 이외의 데코레이터에 의해 검증된다.
export function IsOptionalNonNullable(data?: {
  nullable: boolean
  validationOptions?: ValidationOptions
}) {
  const { nullable = false, validationOptions = undefined } = data || {}

  if (nullable) {
    // IsOptional allows null
    return IsOptional(validationOptions)
  }

  return ValidateIf((ob: any, v: any) => {
    return v !== undefined
  }, validationOptions)
}

export class PatchEventPayload {
  @IsString()
  @IsOptionalNonNullable()
  @ApiPropertyOptional({
    description: '모임 이름',
    type: String,
  })
  title?: string;

  @IsString()
  @IsOptionalNonNullable()
  @ApiPropertyOptional({
    description: '모임 설명',
    type: String,
  })
  description?: string;

  @IsInt()
  @IsOptionalNonNullable()
  @ApiPropertyOptional({
    description: '모임 카테고리',
    type: Number,
  })
  categoryId?: number;

  @IsInt()
  @IsOptionalNonNullable()
  @ApiPropertyOptional({
    description: '모임 지역(도시)',
    type: Number,
  })
  cityId?: number;

  @IsDate()
  @IsOptionalNonNullable()
  @Type(() => Date)
  @ApiPropertyOptional({
    description: '모임 시작 시각',
    type: Date,
  })
  startTime?: Date;

  @IsDate()
  @IsOptionalNonNullable()
  @Type(() => Date)
  @ApiPropertyOptional({
    description: '모임 종료 시각',
    type: Date,
  })
  endTime?: Date;

  @IsInt()
  @IsOptionalNonNullable()
  @Min(2)
  @ApiPropertyOptional({
    description: '모임 최대 정원 (주최자 포함)',
    type: Number,
  })
  maxPeople?: number;
}
