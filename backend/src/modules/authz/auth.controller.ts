import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@User() user: any) {
    return user;
  }
}
