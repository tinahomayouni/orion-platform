import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

type AmqpConnection = amqp.ChannelModel;
type ConsumeHandler = (payload: any) => Promise<void>;

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private connection: AmqpConnection | null = null;
  private channel: amqp.Channel | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('RMQ_URL') ?? 'amqp://localhost:5672';
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    this.logger.log(`Connected to RabbitMQ at ${url}`);
  }

  async onModuleDestroy() {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private getChannel(): amqp.Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }
    return this.channel;
  }

  async publish(queue: string, payload: unknown): Promise<void> {
    const channel = this.getChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: 'application/json',
    });
  }

  async consume(
    queue: string,
    prefetch: number,
    handler: ConsumeHandler,
  ): Promise<void> {
    const channel = this.getChannel();
    await channel.assertQueue(queue, { durable: true });
    await channel.prefetch(prefetch);

    await channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        await handler(payload);
        channel.ack(msg);
      } catch (err) {
        this.logger.error(
          `Failed processing message on ${queue}: ${(err as Error).message}`,
          (err as Error).stack,
        );
        channel.nack(msg, false, false);
      }
    });
  }
}
