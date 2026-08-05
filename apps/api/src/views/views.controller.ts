import { Controller, Get, Query, Render } from '@nestjs/common';
import {
  ALL_ANALYSIS_ASSETS,
  NewsSource,
} from '@app/shared';
import { ChartQueryDto } from '../news/dto/chart-query.dto';
import { NewsSentimentFilter, QueryNewsDto } from '../news/dto/query-news.dto';
import { NewsService } from '../news/news.service';

@Controller()
export class ViewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @Render('news-dashboard')
  async dashboard(
    @Query() query: QueryNewsDto & ChartQueryDto,
  ) {
    // Default the dashboard to today's calendar events so weekly rows don't hide "today".
    const day = query.day?.trim() ? query.day : 'today';
    const listQuery: QueryNewsDto = { ...query, day };

    const list = await this.newsService.findAll(listQuery);
    const chart = await this.newsService.chart({
      asset: query.asset,
      days: query.days ?? 7,
      groupBy: query.groupBy,
      from: query.from,
      to: query.to,
    });

    return {
      filters: {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        asset: query.asset ?? '',
        sentiment: query.sentiment ?? '',
        source: query.source ?? '',
        q: query.q ?? '',
        days: query.days ?? 7,
        day,
      },
      list,
      chart,
      assets: ALL_ANALYSIS_ASSETS,
      sources: Object.values(NewsSource),
      sentiments: Object.values(NewsSentimentFilter),
      todayIso: new Date().toISOString().slice(0, 10),
    };
  }
}
