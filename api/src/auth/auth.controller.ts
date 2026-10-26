import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyTwoFactorDto,
} from './dto/auth.dto';
import { Public, CurrentUser, Roles } from '../common/decorators/auth.decorator';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: process.env.NODE_ENV === 'production' ? 5 : 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Member Self-Registration' })
  @ApiResponse({ status: 201, description: 'User registration created (status pending)' })
  @ApiResponse({ status: 409, description: 'Email or phone already registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  private extractClientIp(req: any): string {
    const forwarded = req?.headers ? req.headers['x-forwarded-for'] : undefined;
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    }
    return req?.ip || req?.connection?.remoteAddress || req?.socket?.remoteAddress || '';
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: process.env.NODE_ENV === 'production' ? 10 : 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Member Portal Login (Restricted to Member Accounts)' })
  @ApiResponse({ status: 200, description: 'Login successful, returns tokens and profile' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account locked or suspended' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const ip = this.extractClientIp(req);
    return this.authService.login(dto, ip);
  }

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: process.env.NODE_ENV === 'production' ? 5 : 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Admin / Staff Login (Restricted to Staff Roles)' })
  @ApiResponse({
    status: 200,
    description: 'Admin login successful, returns tokens and redirect target',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account locked or suspended or IP blocked' })
  async adminLogin(@Body() dto: LoginDto, @Req() req: any) {
    const ip = this.extractClientIp(req);
    return this.authService.adminLogin(dto, ip);
  }

  @Post('admin/logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager')
  @ApiOperation({ summary: 'Revoke all refresh tokens for this staff user across all devices' })
  @ApiResponse({ status: 200, description: 'Logged out of all sessions successfully' })
  async logoutAll(@CurrentUser('id') userId: string, @Req() req: any) {
    const ip = this.extractClientIp(req);
    return this.authService.logoutAll(userId, ip);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate Refresh Token' })
  @ApiResponse({ status: 200, description: 'New access and refresh token pair' })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@CurrentUser('id') userId: string, @Body() dto: Partial<RefreshTokenDto>) {
    return this.authService.logout(userId, dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Request password reset code via email' })
  @ApiResponse({ status: 200, description: 'Reset code sent if email exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Reset password using email code' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile and member details' })
  @ApiResponse({ status: 200, description: 'Profile information' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Post('2fa/setup')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager')
  @ApiOperation({ summary: 'Setup TOTP Two-Factor Authentication' })
  @ApiResponse({ status: 200, description: 'Returns secret and QR code' })
  async setup2FA(@CurrentUser('id') userId: string) {
    return this.authService.setupTwoFactor(userId);
  }

  @Post('2fa/verify')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager')
  @ApiOperation({ summary: 'Verify and enable Two-Factor Authentication' })
  @ApiResponse({ status: 200, description: '2FA enabled' })
  async verify2FA(@CurrentUser('id') userId: string, @Body() dto: VerifyTwoFactorDto) {
    return this.authService.verifyTwoFactor(userId, dto);
  }

  @Post('2fa/disable')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher', 'content_manager')
  @ApiOperation({ summary: 'Disable Two-Factor Authentication' })
  @ApiResponse({ status: 200, description: '2FA disabled' })
  async disable2FA(@CurrentUser('id') userId: string) {
    return this.authService.disableTwoFactor(userId);
  }
}
