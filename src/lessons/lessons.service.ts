import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lesson, LessonDocument } from './schemas/lesson.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Role } from '../common/enums/role.enum';
import { ReorderLessonsDto } from './dto/reorder-lessons.dto';

@Injectable()
export class LessonsService {
    constructor(
        @InjectModel(Lesson.name)
        private readonly lessonModel: Model<LessonDocument>,
        @InjectModel(Course.name)
        private readonly courseModel: Model<CourseDocument>,
    ) { }

    async create(
        courseId: string,
        createLessonDto: CreateLessonDto,
        user: {
            sub: string;
            role: Role;
        },
    ) {

        if (!Types.ObjectId.isValid(courseId)) {
            throw new BadRequestException('Invalid course id');
        }

        const course = await this.courseModel.findById(courseId);

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (
            user.role === Role.INSTRUCTOR &&
            course.instructor.toString() !== user.sub
        ) {
            throw new ForbiddenException(
                'You can create lessons only in your own course',
            );
        }

        return this.lessonModel.create({
            ...createLessonDto,
            course: course._id,
        });
    }

    async findAll(
        courseId: string,
        user: {
            sub: string;
            role: Role;
        },
    ) {
        if (!Types.ObjectId.isValid(courseId)) {
            throw new BadRequestException('Invalid course id');
        }

        const course = await this.courseModel.findById(courseId);

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        const isOwner =
            user.role === Role.ADMIN ||
            course.instructor.toString() === user.sub;

        const filter: Record<string, unknown> = {
            course: new Types.ObjectId(courseId),
        };

        if (!isOwner) {
            filter.isPublished = true;
        }

        return this.lessonModel.find(filter).sort({ order: 1 }).exec();
    }

    async findOne(
        courseId: string,
        lessonId: string,
        user: {
            sub: string;
            role: Role;
        },
    ) {
        if (
            !Types.ObjectId.isValid(courseId) ||
            !Types.ObjectId.isValid(lessonId)
        ) {
            throw new BadRequestException('Invalid id');
        }

        const course = await this.courseModel.findById(courseId);

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        const isOwner =
            user.role === Role.ADMIN ||
            course.instructor.toString() === user.sub;

        const lessonFilter: Record<string, unknown> = {
            _id: new Types.ObjectId(lessonId),
            course: new Types.ObjectId(courseId),
        };

        if (!isOwner) {
            lessonFilter.isPublished = true;
        }

        const lesson = await this.lessonModel.findOne(lessonFilter);

        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }

        return lesson;
    }

    async update(
        courseId: string,
        lessonId: string,
        updateLessonDto: UpdateLessonDto,
        user: any,
    ) {
        if (
            !Types.ObjectId.isValid(courseId) ||
            !Types.ObjectId.isValid(lessonId)
        ) {
            throw new BadRequestException('Invalid id');
        }

        const course = await this.courseModel.findById(courseId);

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (
            user.role === Role.INSTRUCTOR &&
            course.instructor.toString() !== user.sub
        ) {
            throw new ForbiddenException(
                'You can update lessons only in your own course',
            );
        }

        const lesson = await this.lessonModel.findOne({
            _id: new Types.ObjectId(lessonId),
            course: new Types.ObjectId(courseId),
        });

        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }

        Object.assign(lesson, updateLessonDto);

        return lesson.save();
    }

    async remove(
        courseId: string,
        lessonId: string,
        user: any,
    ) {
        if (
            !Types.ObjectId.isValid(courseId) ||
            !Types.ObjectId.isValid(lessonId)
        ) {
            throw new BadRequestException('Invalid id');
        }

        const course = await this.courseModel.findById(courseId);

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (
            user.role === Role.INSTRUCTOR &&
            course.instructor.toString() !== user.sub
        ) {
            throw new ForbiddenException(
                'You can delete lessons only from your own course',
            );
        }

        const lesson = await this.lessonModel.findOneAndDelete({
            _id: new Types.ObjectId(lessonId),
            course: new Types.ObjectId(courseId),
        });

        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }

        return {
            message: 'Lesson deleted successfully',
        };
    }

    async reorder(
        courseId: string,
        body: ReorderLessonsDto,
        user: {
            sub: string;
            role: Role;
        },
    ) {
        if (!Types.ObjectId.isValid(courseId)) {
            throw new BadRequestException('Invalid course id');
        }

        const course = await this.courseModel.findById(courseId);

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (
            user.role === Role.INSTRUCTOR &&
            course.instructor.toString() !== user.sub
        ) {
            throw new ForbiddenException(
                'You can reorder lessons only in your own course',
            );
        }

        const lessons = await this.lessonModel
            .find({
                _id: {
                    $in: body.lessonIds.map(
                        (lessonId) => new Types.ObjectId(lessonId),
                    ),
                },
                course: new Types.ObjectId(courseId),
            })
            .exec();

        if (lessons.length !== body.lessonIds.length) {
            throw new NotFoundException(
                'One or more lessons were not found in this course',
            );
        }

        await Promise.all(
            body.lessonIds.map((lessonId, index) =>
                this.lessonModel.updateOne(
                    {
                        _id: new Types.ObjectId(lessonId),
                        course: new Types.ObjectId(courseId),
                    },
                    {
                        order: index + 1,
                    },
                ),
            ),
        );

        return this.lessonModel
            .find({
                course: new Types.ObjectId(courseId),
            })
            .sort({ order: 1 })
            .exec();
    }
}
