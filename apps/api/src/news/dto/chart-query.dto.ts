import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { AnalysisAsset } from '@app/shared';

export enum ChartGroupBy {
  DAY = 'day',
  HOUR = 'hour',
}

export class ChartQueryDto {
  @ApiPropertyOptional({ enum: AnalysisAsset })
  @IsOptional()
  @IsEnum(AnalysisAsset)
  asset?: AnalysisAsset;

  @ApiPropertyOptional({
    description: 'ISO start date (default: 7 days ago)',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO end date (default: now)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: ChartGroupBy, default: ChartGroupBy.DAY })
  @IsOptional()
  @IsEnum(ChartGroupBy)
  groupBy?: ChartGroupBy = ChartGroupBy.DAY;

  @ApiPropertyOptional({
    description: 'Lookback days when from is omitted',
    default: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number = 7;
}
