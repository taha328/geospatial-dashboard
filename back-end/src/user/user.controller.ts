import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { AuthService } from '../auth/auth.service';
import { InviteDto } from '../auth/dto/invite.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

// Protect entire controller: require authenticated administrateur
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrateur')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService, private readonly authService: AuthService) {}

  @Get()
  getAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Post()
  create(@Body() user: Partial<User>) {
    // For backward compatibility, allow direct create
    return this.userService.create(user);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrateur')
  async invite(@Body() body: any) {
    // Manually validate invite payload to avoid global ValidationPipe whitelist issues
    const dto = plainToInstance(InviteDto, body);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length > 0) {
      // collect messages
      const messages = errors.flatMap(e => Object.values(e.constraints || {}));
      throw new BadRequestException(messages);
    }

  // delegate to AuthService.invite (injected)
  return this.authService.invite(dto as any);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() user: Partial<User>) {
    return this.userService.update(id, user);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.delete(id);
  }
}
