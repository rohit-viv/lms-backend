import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
    FileTypeValidator,
    MaxFileSizeValidator,
    ParseFilePipe,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CourseQueryDto } from './dto/course-query.dto';

@Controller('courses')
export class CoursesController {
    constructor(
        private readonly coursesService: CoursesService,
    ) { }

    @Post()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.INSTRUCTOR)
    create(
        @Body() createCourseDto: CreateCourseDto,
        @CurrentUser() user: any,
    ) {
        return this.coursesService.create(
            createCourseDto,
            user.sub,
        );
    }

    @Get()
    @UseGuards(AuthGuard)
    findAll(
        @Query() query: CourseQueryDto,
        @CurrentUser() user: any,
    ) {
        return this.coursesService.findAll(query, user);
    }

    @Get('instructor/me')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.INSTRUCTOR)
    findMine(
        @CurrentUser() user: any,
    ) {
        return this.coursesService.findMine(user.sub);
    }

    @Get(':id')
    findOne(
        @Param('id', ParseObjectIdPipe) id: string,
    ) {
        return this.coursesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.INSTRUCTOR)
    update(
        @Param('id', ParseObjectIdPipe) id: string,
        @Body() updateCourseDto: UpdateCourseDto,
        @CurrentUser() user: any,
    ) {
        return this.coursesService.update(
            id,
            updateCourseDto,
            user,
        );
    }

    @Delete(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.INSTRUCTOR)
    remove(
        @Param('id', ParseObjectIdPipe) id: string,
        @CurrentUser() user: any,
    ) {
        return this.coursesService.remove(id, user);
    }

    @Patch(':id/publish')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.INSTRUCTOR)
    publish(
        @Param('id', ParseObjectIdPipe) id: string,
        @CurrentUser() user: any,
    ) {
        return this.coursesService.publish(id, user);
    }

    @Post(':id/thumbnail')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.INSTRUCTOR)
    @UseInterceptors(
    FileInterceptor('file', {
        storage: memoryStorage(),
    }),
)
    uploadThumbnail(
        @Param('id', ParseObjectIdPipe) id: string,

        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({
                        maxSize: 5 * 1024 * 1024,
                    }),

                    new FileTypeValidator({
                        fileType: /(jpg|jpeg|png|webp)$/,
                    }),
                ],
            }),
        )
        file: Express.Multer.File,

        @CurrentUser() user: any,
    ) {
        return this.coursesService.updateThumbnail(
           id,
    file,
    user,
        );
    }
}
