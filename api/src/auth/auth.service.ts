import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyTwoFactorDto,
} from './dto/auth.dto';
import { UserStatus, MemberStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // -------------------------------------------------------------
  // 1. REGISTER (member self-registration, creates pending user)
  // -------------------------------------------------------------
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const memberRole = await this.prisma.role.findUnique({
      where: { name: 'member' },
    });

    if (!memberRole) {
      throw new BadRequestException('Default member role not configured');
    }

    const passwordHash = await argon2.hash(dto.password);

    // Generate unique member number
    const count = await this.prisma.member.count();
    const memberNo = `MEM-${(count + 1).toString().padStart(4, '0')}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          roleId: memberRole.id,
          status: UserStatus.pending,
        },
      });

      const member = await tx.member.create({
        data: {
          memberNo,
          userId: user.id,
          firstName: dto.firstName,
          fatherName: dto.fatherName,
          grandfatherName: dto.grandfatherName,
          baptismalName: dto.baptismalName,
          sex: dto.sex,
          phone: dto.phone,
          email: dto.email,
          status: MemberStatus.pending,
        },
      });

      return { user, member };
    });

    await this.mailService.sendWelcomeEmail(dto.email, `${dto.firstName} ${dto.fatherName}`);

    return {
      message: 'Registration successful. Account is pending approval.',
      user: {
        id: result.user.id,
        email: result.user.email,
        phone: result.user.phone,
        status: result.user.status,
      },
      member: {
        id: result.member.id,
        memberNo: result.member.memberNo,
        fullName: `${result.member.firstName} ${result.member.fatherName}`,
      },
    };
  }

  // -------------------------------------------------------------
  // 2. LOGIN (with 5 failed attempts lockout, optional TOTP)
  // -------------------------------------------------------------
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { phone: dto.identifier }],
      },
      include: {
        role: true,
        member: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status
    if (user.status === UserStatus.suspended) {
      throw new ForbiddenException('Account has been suspended. Please contact admin.');
    }

    // Check lockout
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - now.getTime()) / (60 * 1000),
      );
      throw new ForbiddenException(
        `Account is locked due to multiple failed login attempts. Try again in ${minutesRemaining} minutes.`,
      );
    }

    // Verify password
    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      const newFailedLogins = user.failedLogins + 1;
      let lockedUntil: Date | null = null;

      if (newFailedLogins >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins: newFailedLogins,
          lockedUntil,
        },
      });

      if (newFailedLogins >= 5) {
        throw new ForbiddenException(
          'Maximum login attempts exceeded. Account is locked for 15 minutes.',
        );
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    // Two-factor check if enabled
    if (user.twoFactorSecret) {
      if (!dto.twoFactorToken) {
        return {
          requiresTwoFactor: true,
          message: 'Two-factor authentication code required',
        };
      }

      const isValidToken = authenticator.verify({
        token: dto.twoFactorToken,
        secret: user.twoFactorSecret,
      });

      if (!isValidToken) {
        throw new UnauthorizedException('Invalid two-factor authentication code');
      }
    }

    // Reset failed logins & update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role.name);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role: user.role.name,
        permissions: user.role.permissions,
        member: user.member,
      },
      ...tokens,
    };
  }

  // -------------------------------------------------------------
  // 3. REFRESH TOKEN (rotate refresh token, store hashed)
  // -------------------------------------------------------------
  async refreshToken(dto: RefreshTokenDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: { role: true },
        },
      },
    });

    if (!storedToken) {
      // Check if token was recently rotated (within 30 seconds) to tolerate concurrent requests
      const recentToken = await this.prisma.refreshToken.findFirst({
        where: {
          userId: payload.sub,
          tokenHash,
          revoked: true,
          createdAt: { gt: new Date(Date.now() - 30 * 1000) },
        },
        include: {
          user: {
            include: { role: true },
          },
        },
      });

      if (recentToken) {
        return this.generateTokens(
          recentToken.user.id,
          recentToken.user.email,
          recentToken.user.role.name,
        );
      }

      throw new UnauthorizedException('Refresh token revoked or not found');
    }

    // Revoke current token immediately (Rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Generate new pair
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role.name,
    );

    return tokens;
  }

  // -------------------------------------------------------------
  // 4. LOGOUT
  // -------------------------------------------------------------
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash },
        data: { revoked: true },
      });
    } else {
      // Revoke all tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
    }

    return { message: 'Logged out successfully' };
  }

  // -------------------------------------------------------------
  // 5. FORGOT PASSWORD & RESET PASSWORD
  // -------------------------------------------------------------
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      // 6-digit random code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await argon2.hash(code);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await this.prisma.setting.upsert({
        where: { settingKey: `pwd_reset_${user.id}` },
        update: {
          settingValue: { codeHash, expiresAt: expiresAt.toISOString() },
        },
        create: {
          settingKey: `pwd_reset_${user.id}`,
          settingValue: { codeHash, expiresAt: expiresAt.toISOString() },
        },
      });

      await this.mailService.sendPasswordResetCode(dto.email, code);
    }

    // Always return success message to avoid email enumeration
    return {
      message: 'If the email exists in our records, a reset code has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const resetRecord = await this.prisma.setting.findUnique({
      where: { settingKey: `pwd_reset_${user.id}` },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const data = resetRecord.settingValue as { codeHash: string; expiresAt: string };
    const expiresAt = new Date(data.expiresAt);

    if (new Date() > expiresAt) {
      await this.prisma.setting.delete({ where: { settingKey: `pwd_reset_${user.id}` } });
      throw new BadRequestException('Reset code has expired');
    }

    const isCodeValid = await argon2.verify(data.codeHash, dto.code);
    if (!isCodeValid) {
      throw new BadRequestException('Invalid reset code');
    }

    const newHash = await argon2.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        failedLogins: 0,
        lockedUntil: null,
      },
    });

    // Delete reset code record
    await this.prisma.setting.delete({ where: { settingKey: `pwd_reset_${user.id}` } });

    // Revoke all sessions
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    });

    return { message: 'Password reset successfully. You can now log in.' };
  }

  // -------------------------------------------------------------
  // 6. TWO-FACTOR AUTHENTICATION (Setup, Verify, Disable)
  // -------------------------------------------------------------
  async setupTwoFactor(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(
      user.email || user.id,
      'Aemade Selam Sunday School',
      secret,
    );
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Store temporary secret until verified
    await this.prisma.setting.upsert({
      where: { settingKey: `2fa_temp_${userId}` },
      update: { settingValue: { secret } },
      create: { settingKey: `2fa_temp_${userId}`, settingValue: { secret } },
    });

    return {
      secret,
      qrCode: qrCodeDataUrl,
      message: 'Scan the QR code with your Authenticator app and call /auth/2fa/verify with code.',
    };
  }

  async verifyTwoFactor(userId: string, dto: VerifyTwoFactorDto) {
    const tempRecord = await this.prisma.setting.findUnique({
      where: { settingKey: `2fa_temp_${userId}` },
    });

    if (!tempRecord) {
      throw new BadRequestException('No pending 2FA setup found');
    }

    const { secret } = tempRecord.settingValue as { secret: string };
    const isValid = authenticator.verify({
      token: dto.code,
      secret,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid two-factor code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    await this.prisma.setting.delete({ where: { settingKey: `2fa_temp_${userId}` } });

    return { message: 'Two-factor authentication successfully enabled' };
  }

  async disableTwoFactor(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null },
    });

    return { message: 'Two-factor authentication disabled' };
  }

  // -------------------------------------------------------------
  // 7. GET ME
  // -------------------------------------------------------------
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        member: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      status: user.status,
      twoFactorEnabled: !!user.twoFactorSecret,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      role: {
        id: user.role.id,
        name: user.role.name,
        permissions: user.role.permissions,
      },
      member: user.member,
    };
  }

  // -------------------------------------------------------------
  // HELPER: Generate Access & Refresh tokens
  // -------------------------------------------------------------
  private async generateTokens(userId: string, email: string | null, role: string) {
    const payload = { sub: userId, email, role };

    // 15 min access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });

    // 7 days refresh token with unique jti so consecutive tokens are always distinct
    const refreshToken = this.jwtService.sign(
      { ...payload, jti: crypto.randomUUID() },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 mins in seconds
    };
  }
}
