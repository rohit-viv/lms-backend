import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('returns tokens and user data on successful login', async () => {
    const userService = {
      findByEmail: jest.fn().mockResolvedValue({
        _id: 'user-1',
        name: 'Rohit',
        email: 'rohit@example.com',
        password: await bcrypt.hash(
          'secret123',
          10,
        ),
        role: 'student',
      }),
      updateRefreshToken: jest
        .fn()
        .mockResolvedValue(null),
    };

    const jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
    };

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'jwt';
        if (key === 'JWT_REFRESH_SECRET') {
          return 'refresh';
        }
        if (key === 'JWT_EXPIRES_IN') return '15m';
        if (key === 'JWT_REFRESH_EXPIRES_IN')
          return '7d';
        return undefined;
      }),
    };

    const service = new AuthService(
      userService as never,
      jwtService as never,
      configService as never,
    );

    const result = await service.login({
      email: 'rohit@example.com',
      password: 'secret123',
    });

    expect(result.accessToken).toBe(
      'access-token',
    );
    expect(result.refreshToken).toBe(
      'refresh-token',
    );
    expect(result.user.email).toBe(
      'rohit@example.com',
    );
    expect(
      userService.updateRefreshToken,
    ).toHaveBeenCalled();
  });

  it('rejects invalid credentials', async () => {
    const service = new AuthService(
      {
        findByEmail: jest
          .fn()
          .mockResolvedValue(null),
      } as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'secret123',
      }),
    ).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
