import {
    Body,
    Controller,
    Param,
    Post,
    Get,
    Patch,
    Delete,
    UseGuards,
} from '@nestjs/common';

import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReorderLessonsDto } from './dto/reorder-lessons.dto';

@Controller('courses/:courseId/lessons')
export class LessonsController {
    constructor(
        private readonly lessonsService: LessonsService,
    ) { }

    @Post()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.INSTRUCTOR)
    create(
        @Param('courseId') courseId: string,
        @Body() createLessonDto: CreateLessonDto,
        @CurrentUser() user: any,
    ) {
        return this.lessonsService.create(
            courseId,
            createLessonDto,
            user,
        );
    }

    @Get()
    @UseGuards(AuthGuard)
    findAll(
        @Param('courseId') courseId: string,
        @CurrentUser() user: any,
    ) {
        return this.lessonsService.findAll(courseId, user);
    }

    @Get(':lessonId')
    @UseGuards(AuthGuard)
    findOne(
        @Param('courseId') courseId: string,
        @Param('lessonId') lessonId: string,
        @CurrentUser() user: any,
    ) {
        return this.lessonsService.findOne(
            courseId,
            lessonId,
            user,
        );
    }

    @Patch(':lessonId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.INSTRUCTOR)
    update(
        @Param('courseId') courseId: string,
        @Param('lessonId') lessonId: string,
        @Body() updateLessonDto: UpdateLessonDto,
        @CurrentUser() user: any,
    ) {
        return this.lessonsService.update(
            courseId,
            lessonId,
            updateLessonDto,
            user,
        );
    }

    @Patch('reorder')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.INSTRUCTOR)
    reorder(
        @Param('courseId') courseId: string,
        @Body() body: ReorderLessonsDto,
        @CurrentUser() user: any,
    ) {
        return this.lessonsService.reorder(
            courseId,
            body,
            user,
        );
    }

    @Delete(':lessonId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.INSTRUCTOR)
    remove(
        @Param('courseId') courseId: string,
        @Param('lessonId') lessonId: string,
        @CurrentUser() user: any,
    ) {
        return this.lessonsService.remove(
            courseId,
            lessonId,
            user,
        );
    }
}
