import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateUserTokenDto {
  @IsNotEmpty()
  user_id: number;
  
  @IsNotEmpty()
  token_hash: string;

  @IsNotEmpty()
  type: string; // 'activation'

  @IsNotEmpty()
  expires_at: Date; 

  @IsOptional()
  @IsBoolean()
  used_at?: Date | null;
}

export class UpdateUserTokenDto extends PartialType(CreateUserTokenDto) {}