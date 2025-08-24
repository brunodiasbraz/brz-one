import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('find/all')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('find/:id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Get('activate')
  activate(@Query('token') token: string) {
    return this.usersService.activateUser(token);
  }

  @Post('resend-activation')
  resend(@Body('email') email: string) {
    return this.usersService.resendActivation(email);
  }
}
