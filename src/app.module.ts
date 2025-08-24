import { Module } from '@nestjs/common';
import { Users } from './user/model/users.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'brz2025',
      database: 'brz_one',
      autoLoadModels: true,
      synchronize: true,
      models: [Users],
    }),
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
