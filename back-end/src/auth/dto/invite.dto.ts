import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class InviteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsIn(['administrateur', 'maitre_d_ouvrage', 'operateur'])
  role: 'administrateur' | 'maitre_d_ouvrage' | 'operateur';
}
