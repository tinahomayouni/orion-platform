import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AnalysisAsset, NewsSource } from '@app/shared';

export enum NewsSentimentFilter {
  BULLISH = 'bullish',
  BEARISH = 'bearish',
  NEUTRAL = 'neutral',
}

export class QueryNewsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /** Filter 1 — asset matched by analyser (gold, btc, …) */
  @ApiPropertyOptional({ enum: AnalysisAsset })
  @IsOptional()
  @IsEnum(AnalysisAsset)
  asset?: AnalysisAsset;

  /** Filter 2 — sentiment */
  @ApiPropertyOptional({ enum: NewsSentimentFilter })
  @IsOptional()
  @IsEnum(NewsSentimentFilter)
  sentiment?: NewsSentimentFilter;

  /** Filter 3 — news source */
  @ApiPropertyOptional({ enum: NewsSource })
  @IsOptional()
  @IsEnum(NewsSource)
  source?: NewsSource;

  @ApiPropertyOptional({ description: 'Search in title' })
  @IsOptional()
  @IsString()
  q?: string;
}
