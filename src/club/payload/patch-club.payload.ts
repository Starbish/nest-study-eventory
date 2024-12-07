import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { ValidationOptions } from 'joi';

export function IsOptionalNonNullable(data?: {
  nullable: boolean;
  validationOptions?: ValidationOptions;
}) {
  const { nullable = false, validationOptions = undefined } = data || {};

  if (nullable) {
    // IsOptional allows null
    return IsOptional(validationOptions);
  }

  return ValidateIf((ob: any, v: any) => {
    return v !== undefined;
  }, validationOptions);
}

export class PatchClubPayload {
  @IsString()
  @IsOptionalNonNullable()
  @ApiPropertyOptional({
    description: '클럽 이름',
    type: String,
  })
  title?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: '클럽 설명',
    type: String,
  })
  description?: string | null;
}
