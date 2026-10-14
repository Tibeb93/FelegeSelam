import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/auth.decorator';

@ApiTags('Reports & Dashboard')
@Controller('reports')
@UseGuards(RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary:
      'Executive dashboard metrics: members, growth, departments, age groups, attendance rates, posts, forms, events',
  })
  @ApiResponse({ status: 200, description: 'Dashboard metrics calculated successfully' })
  async getDashboard() {
    return this.reportsService.getDashboard();
  }
}
