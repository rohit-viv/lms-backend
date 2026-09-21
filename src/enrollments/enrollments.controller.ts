import {
    Controller,
    Param,
    Post,
    Get,
    Patch,
    UseGuards,
} from '@nestjs/common';

import { EnrollmentsService } from './enrollments.service';

import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('courses')
export class EnrollmentsController {
    constructor(
        private readonly enrollmentsService: EnrollmentsService,
    ) { }

    @Post(':courseId/enroll')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    enroll(
        @Param('courseId') courseId: string,
        @CurrentUser() user: any,
    ) {
        return this.enrollmentsService.enroll(
            courseId,
            user.sub,
        );
    }

    @Get('my/enrollments')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    findMyCourses(
        @CurrentUser() user: any,
    ) {
        return this.enrollmentsService.findMyCourses(user.sub);
    }

    @Patch(':courseId/lessons/:lessonId/complete')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    completeLesson(
        @Param('courseId') courseId: string,
        @Param('lessonId') lessonId: string,
        @CurrentUser() user: any,
    ) {
        return this.enrollmentsService.completeLesson(
            courseId,
            lessonId,
            user.sub,
        );
    }
}