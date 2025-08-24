import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateUserDto {
  @IsNotEmpty()
  name: string;
  
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}