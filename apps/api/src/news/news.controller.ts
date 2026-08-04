import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChartQueryDto } from './dto/chart-query.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsService } from './news.service';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({
    summary: 'List news (paginated)',
    description:
      'Essential filters: asset, sentiment, source. Optional title search via q.',
  })
  @ApiOkResponse({ description: '{ items, meta }' })
  findAll(@Query() query: QueryNewsDto) {
    return this.newsService.findAll(query);
  }

  @Get('analytics/chart')
  @ApiOperation({
    summary: 'Simple analytics chart data',
    description:
      'Time series of count + avg scores, plus sentiment breakdown. Filter by asset.',
  })
  chart(@Query() query: ChartQueryDto) {
    return this.newsService.chart(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one news item' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.newsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update news fields (manual override)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNewsDto,
  ) {
    return this.newsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a news item' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.newsService.remove(id);
  }
}
