import { Module } from '@nestjs/common';
import { NewsModule } from '../news/news.module';
import { ViewsController } from './views.controller';

@Module({
  imports: [NewsModule],
  controllers: [ViewsController],
})
export class ViewsModule {}
