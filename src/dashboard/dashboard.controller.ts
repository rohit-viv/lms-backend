import {
    Controller,
    Get,
    UseGuards,
} from '@nestjs/common';

import { DashboardService } from './dashboard.service';

import { AuthGuard } from '../auth/guards/auth.guard';

import { RolesGuard } from '../common/guards/roles.guard';

import { Roles } from '../common/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';

@Controller('dashboard')
@UseGuards(
    AuthGuard,
    RolesGuard,
)
export class DashboardController {
    constructor(
        private readonly dashboardService: DashboardService,
    ) { }

    @Get('stats')
    @Roles(Role.ADMIN)
    async getAdminStats() {
        return this.dashboardService.getAdminStats();
    }
}
