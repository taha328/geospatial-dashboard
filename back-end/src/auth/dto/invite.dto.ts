import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class InviteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsIn(['administrateur', 'utilisateur'])
  role: 'administrateur' | 'utilisateur';
}
