import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, AssignRoleDto } from './dto/user.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import * as argon2 from 'argon2';
import { UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { phone: { contains: query.search } },
        { member: { firstName: { contains: query.search } } },
        { member: { fatherName: { contains: query.search } } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort) {
      const [field, order] = query.sort.split(':');
      if (['email', 'createdAt', 'status'].includes(field)) {
        orderBy = { [field]: order === 'asc' ? 'asc' : 'desc' };
      }
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          phone: true,
          status: true,
          failedLogins: true,
          lockedUntil: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true, permissions: true } },
          member: {
            select: {
              id: true,
              memberNo: true,
              firstName: true,
              fatherName: true,
              grandfatherName: true,
              photoUrl: true,
            },
          },
        },
      }),
    ]);

    return paginate(users, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        status: true,
        failedLogins: true,
        lockedUntil: true,
        lastLogin: true,
        twoFactorSecret: false, // Never return secret
        createdAt: true,
        updatedAt: true,
        role: true,
        member: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])],
      },
    });

    if (existing) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role) {
      throw new BadRequestException(`Role with ID ${dto.roleId} not found`);
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        roleId: dto.roleId,
        status: dto.status || UserStatus.active,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        role: true,
      },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const updateData: any = {};
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.password) {
      updateData.passwordHash = await argon2.hash(dto.password);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        status: true,
        updatedAt: true,
        role: true,
      },
    });

    return updatedUser;
  }

  async suspend(id: string) {
    await this.findOne(id);

    const suspendedUser = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.suspended },
      select: {
        id: true,
        email: true,
        status: true,
        updatedAt: true,
      },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { revoked: true },
    });

    return suspendedUser;
  }

  async assignRole(id: string, dto: AssignRoleDto) {
    await this.findOne(id);

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role) {
      throw new BadRequestException(`Role with ID ${dto.roleId} not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { roleId: dto.roleId },
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}
