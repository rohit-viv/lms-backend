import { Body, Controller, Get, Post, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
    constructor(private readonly authSevice: AuthService) { }
    @Post('register')
    async register(@Body() body: RegisterDto) {
        let result = await this.authSevice.register(body)
        return {
            result
        }
    }

    @Post('login')
    @Throttle({
        default: {
            limit: 5,
            ttl: 60000,
        },
    })
    login(@Body() body: LoginDto) {
        return this.authSevice.login(body);
    }

    @Get('profile')
    @UseGuards(AuthGuard)
    profile(
        @CurrentUser() user: any,
    ) {
        return user;
    }

    @Get('admin')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    adminOnly(@CurrentUser() user: any) {
        return {
            message: 'Welcome Admin',
            user,
        };
    }

    @Post('refresh')
    refresh(
        @Body() body: RefreshTokenDto,
    ) {
        return this.authSevice.refreshToken(body.refreshToken);
    }

    @Post('logout')
    @UseGuards(AuthGuard)
    logout(
        @CurrentUser() user: any,
    ) {
        return this.authSevice.logout(user.sub);
    }

    @Patch('change-password')
    @UseGuards(AuthGuard)
    changePassword(
        @CurrentUser() user: any,
        @Body() body: ChangePasswordDto,
    ) {
        return this.authSevice.changePassword(
            user.sub,
            body,
        );
    }

    @Post('forgot-password')
    @Throttle({
        default: {
            limit: 3,
            ttl: 60000,
        },
    })
    forgotPassword(
        @Body() body: ForgotPasswordDto,
    ) {
        return this.authSevice.forgotPassword(body.email);
    }

    @Post('reset-password')
    resetPassword(
        @Body() body: ResetPasswordDto,
    ) {
        return this.authSevice.resetPassword(body);
    }
}
