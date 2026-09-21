import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const courseStatuses = ['draft', 'published'] as const;
const courseSortOptions = [
  'latest',
  'oldest',
  'price_asc',
  'price_desc',
] as const;

export class CourseQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(courseStatuses)
  status?: (typeof courseStatuses)[number];

  @IsOptional()
  @IsEnum(courseSortOptions)
  sort?: (typeof courseSortOptions)[number];
}
