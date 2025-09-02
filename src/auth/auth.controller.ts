import { Controller, Get, Post, Body, Patch, Delete, Req, UseGuards, Query, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('forget-password')
  findOne(@Query('email') email: string) {
    Logger.log(email, 'email');
    return this.authService.forgetPassword(email);
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Get('profile')
  @UseGuards(AuthenticationGuard)
  getProfile(@Req() req: any) {

    return this.authService.getProfile(+req.user.id);
  }

  @Patch('update-profile')
  @UseGuards(AuthenticationGuard)
  update(@Req() req: any, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+req.user.id, updateAuthDto);
  }

  @Delete('delete-account')
  @UseGuards(AuthenticationGuard)
  remove(@Req() req: any) {
    return this.authService.remove(+req.user.id);
  }

  // ===== Google =====
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() { }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any) {
    const o = req.user;
    const user = await this.authService.findOrCreateOAuthUser(o);
    const token = this.authService.generateJwt({ id: user.id, role: user.role });
    return { user, token };
  }

  // ===== Facebook =====
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin() {
    return
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: any) {
    const o = req.user;
    const user = await this.authService.findOrCreateOAuthUser(o);
    const token = this.authService.generateJwt({ id: user.id, role: user.role });
    return { user, token };
  }
}
