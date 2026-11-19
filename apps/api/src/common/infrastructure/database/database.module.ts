import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI') ??
          configService.get<string>('MONGODB_URI') ??
          'mongodb://127.0.0.1:27017/fixa',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
