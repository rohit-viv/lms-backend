import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { randomBytes, createHash } from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    private async generateTokens(user: {
        _id: unknown;
        email: string;
        role: string;
    }) {
        const payload = {
            sub: String(user._id),
            email: user.email,
            role: user.role,
        };
        const accessTokenExpiresIn =
            this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m';
        const refreshTokenExpiresIn =
            this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: accessTokenExpiresIn,
        } as JwtSignOptions);

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: refreshTokenExpiresIn,
        } as JwtSignOptions);

        return {
            accessToken,
            refreshToken,
        };
    }

    async register(body: RegisterDto) {
        const existingUser = await this.userService.findByEmail(body.email);

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const user = await this.userService.create({
            name: body.name,
            email: body.email,
            password: hashedPassword,
        });

        return {
            message: 'User registered successfully.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }

    async login(body: LoginDto) {
        const user = await this.userService.findByEmail(body.email);
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        const isPasswordValid = await bcrypt.compare(
            body.password,
            user.password,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }
        const { accessToken, refreshToken } =
            await this.generateTokens(user);

        const hashedRefreshToken = await bcrypt.hash(
            refreshToken,
            10,
        );

        await this.userService.updateRefreshToken(
            user._id.toString(),
            hashedRefreshToken,
        );
        return {
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken,
        };

    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = await this.jwtService.verifyAsync(
                refreshToken,
                {
                    secret: this.configService.get<string>(
                        'JWT_REFRESH_SECRET',
                    ),
                },
            );

            const user = await this.userService.findById(
                payload.sub,
            );

            if (!user || !user.refreshToken) {
                throw new UnauthorizedException(
                    'Invalid refresh token',
                );
            }

            const isRefreshTokenValid =
                await bcrypt.compare(
                    refreshToken,
                    user.refreshToken,
                );

            if (!isRefreshTokenValid) {
                throw new UnauthorizedException(
                    'Invalid refresh token',
                );
            }

            const tokens = await this.generateTokens({
                _id: user._id.toString(),
                email: user.email,
                role: user.role,
            });

            const hashedRefreshToken = await bcrypt.hash(
                tokens.refreshToken,
                10,
            );

            await this.userService.updateRefreshToken(
                user._id.toString(),
                hashedRefreshToken,
            );

            return {
                ...tokens,
            };
        } catch {
            throw new UnauthorizedException(
                'Invalid or expired refresh token',
            );
        }
    }

    async logout(userId: string) {
        await this.userService.updateRefreshToken(
            userId,
            null,
        );

        return {
            message: 'Logout successful',
        };
    }

    async changePassword(
        userId: string,
        body: ChangePasswordDto,
    ) {
        const user = await this.userService.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isOldPasswordValid = await bcrypt.compare(
            body.oldPassword,
            user.password,
        );

        if (!isOldPasswordValid) {
            throw new UnauthorizedException(
                'Old password is incorrect',
            );
        }

        const isSamePassword = await bcrypt.compare(
            body.newPassword,
            user.password,
        );

        if (isSamePassword) {
            throw new BadRequestException(
                'New password must be different from old password',
            );
        }

        const hashedPassword = await bcrypt.hash(
            body.newPassword,
            10,
        );

        await this.userService.updatePassword(
            userId,
            hashedPassword,
        );

        // Existing refresh session revoke
        await this.userService.updateRefreshToken(
            userId,
            null,
        );

        return {
            message: 'Password changed successfully',
        };
    }

    async forgotPassword(email: string) {
        const user = await this.userService.findByEmail(email);

        // Security: user exists hai ya nahi reveal mat karo
        if (!user) {
            return {
                message:
                    'If this email is registered, a reset link has been generated',
            };
        }

        const resetToken = randomBytes(32).toString('hex');

        const hashedToken = createHash('sha256')
            .update(resetToken)
            .digest('hex');

        const expires = new Date(
            Date.now() + 15 * 60 * 1000,
        );

        await this.userService.savePasswordResetToken(
            user._id.toString(),
            hashedToken,
            expires,
        );

        return {
            message: 'Password reset token generated',
            resetToken, // learning only
        };
    }

    async resetPassword(
        body: ResetPasswordDto,
    ) {
        const hashedToken = createHash('sha256')
            .update(body.token)
            .digest('hex');

        const user =
            await this.userService.findByResetToken(
                hashedToken,
            );

        if (!user) {
            throw new BadRequestException(
                'Invalid or expired reset token',
            );
        }

        const hashedPassword = await bcrypt.hash(
            body.newPassword,
            10,
        );

        user.password = hashedPassword;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.refreshToken = null;

        await user.save();

        return {
            message: 'Password reset successfully',
        };
    }
}
