import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AnalysisAsset } from '../enums/analysis-asset.enum';
import { NewsSource, ProcessingStatus, SourceImpact } from '../enums/news.enums';

@Entity('news_items')
@Index(['source', 'publishedAt'])
export class NewsItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  fingerprint: string;

  @Column({ type: 'enum', enum: NewsSource })
  source: NewsSource;

  @Column({ nullable: true })
  externalId?: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column()
  url: string;

  @Column({ type: 'enum', enum: SourceImpact, default: SourceImpact.UNKNOWN })
  sourceImpact: SourceImpact;

  @Column({ type: 'smallint', default: 0 })
  score: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  scoreBreakdown: Record<string, unknown>;

  /** Matched AnalysisAsset values from the enabled ANALYSIS_ASSETS set. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  assets: AnalysisAsset[];

  @Column({ type: 'boolean', default: false })
  relevant: boolean;

  @Column({ type: 'varchar', nullable: true })
  sentiment?: string;

  @Column({ type: 'text', nullable: true })
  analysisSummary?: string;

  @Column({ type: 'smallint', default: 0 })
  finalScore: number;

  @Column({ type: 'timestamptz' })
  @Index()
  publishedAt: Date;

  @Column({ type: 'timestamptz' })
  collectedAt: Date;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  raw: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.COLLECTED,
  })
  status: ProcessingStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
