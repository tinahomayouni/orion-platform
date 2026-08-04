import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ProcessingStatus } from '@app/shared';
import { NewsSentimentFilter } from './query-news.dto';

export class UpdateNewsDto {
  @ApiPropertyOptional({ enum: NewsSentimentFilter })
  @IsOptional()
  @IsEnum(NewsSentimentFilter)
  sentiment?: NewsSentimentFilter;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  analysisSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  finalScore?: number;

  @ApiPropertyOptional({ enum: ProcessingStatus })
  @IsOptional()
  @IsEnum(ProcessingStatus)
  status?: ProcessingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  relevant?: boolean;
}
