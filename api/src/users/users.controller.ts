import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, AssignRoleDto } from './dto/user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/auth.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('super_admin')
  @ApiOperation({ summary: 'List all users with pagination, search & sort (super_admin only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @Get('roles')
  @Roles('super_admin')
  @ApiOperation({ summary: 'List all system roles (super_admin only)' })
  async getRoles() {
    return this.usersService.getRoles();
  }

  @Get(':id')
  @Roles('super_admin')
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOperation({ summary: 'Get user by ID (super_admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create user with role (super_admin only)' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @Roles('super_admin')
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOperation({ summary: 'Update user (super_admin only)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/suspend')
  @Roles('super_admin')
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOperation({ summary: 'Suspend user account and revoke tokens (super_admin only)' })
  @ApiResponse({ status: 200, description: 'User suspended' })
  async suspend(@Param('id') id: string) {
    return this.usersService.suspend(id);
  }

  @Patch(':id/role')
  @Roles('super_admin')
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOperation({ summary: 'Assign new role to user (super_admin only)' })
  @ApiResponse({ status: 200, description: 'Role assigned' })
  async assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.usersService.assignRole(id, dto);
  }
}
