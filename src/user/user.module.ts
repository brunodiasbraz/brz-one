import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { Users } from './model/users.model';
import { JwtModule } from '@nestjs/jwt';
import { UserToken } from './model/user-token.model';

@Module({
  imports: [SequelizeModule.forFeature([Users, UserToken]),
  JwtModule.register({
    secret: process.env.JWT_SECRET || 'brzone_secret_key',
    signOptions: { expiresIn: '7d'}
  })],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
