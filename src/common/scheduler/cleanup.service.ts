import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { UsersService } from '../../users/users.service';

@Injectable()
export class CleanupService {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredResetTokens() {
    console.log('Running reset token cleanup...');

    await this.usersService.cleanupExpiredResetTokens();
  }
}