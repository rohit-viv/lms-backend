import {
    Controller,
    Get,
    Param,
    Patch,
    UseGuards,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
    ) { }

    @Get()
    findMyNotifications(
        @CurrentUser() user: any,
    ) {
        return this.notificationsService.findMyNotifications(
            user.sub,
        );
    }

    @Patch(':id/read')
    markAsRead(
        @Param('id', ParseObjectIdPipe) id: string,
        @CurrentUser() user: any,
    ) {
        return this.notificationsService.markAsRead(
            id,
            user.sub,
        );
    }
}