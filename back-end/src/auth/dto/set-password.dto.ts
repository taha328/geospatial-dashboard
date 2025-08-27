import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  token?: string;
}
