import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    Inject
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';

import { Course, CourseDocument } from './schemas/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Role } from '../common/enums/role.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CourseQueryDto } from './dto/course-query.dto';



@Injectable()
export class CoursesService {
    constructor(
        @InjectModel(Course.name)
        private readonly courseModel: Model<CourseDocument>,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) { }

    async create(
        createCourseDto: CreateCourseDto,
        instructorId: string,
    ) {
        const course = await this.courseModel.create({
            ...createCourseDto,
            instructor: new Types.ObjectId(instructorId),
        });

        return course;
    }

    async findAll(
        query: CourseQueryDto,
        user?: {
            sub: string;
            role: Role;
        },
    ) {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            sort = 'latest',
        } = query;

        const filter: Record<string, unknown> = {};

        if (search) {
            filter.$or = [
                {
                    title: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    description: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
        }

        if (user?.role === Role.ADMIN) {
            if (status) {
                filter.status = status;
            }
        } else if (user?.role === Role.INSTRUCTOR) {
            filter.instructor = new Types.ObjectId(user.sub);
            if (status) {
                filter.status = status;
            }
        } else {
            filter.status = 'published';
        }

        const sortOption: Record<string, SortOrder> =
            sort === 'oldest'
                ? { createdAt: 1 }
                : sort === 'price_asc'
                  ? { price: 1 }
                  : sort === 'price_desc'
                    ? { price: -1 }
                    : { createdAt: -1 };

        const skip = (page - 1) * limit;
        const cacheKey = `courses:${JSON.stringify({
            page,
            limit,
            search,
            status,
            sort,
            role: user?.role ?? 'guest',
            userId: user?.sub ?? null,
        })}`;

        const cached =
            await this.cacheManager.get<{
                data: CourseDocument[];
                pagination: {
                    total: number;
                    page: number;
                    limit: number;
                    totalPages: number;
                };
            }>(cacheKey);

        if (cached) {
            return cached;
        }

        const [courses, total] = await Promise.all([
            this.courseModel
                .find(filter)
                .populate('instructor', 'name email role')
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.courseModel.countDocuments(filter),
        ]);

        const result = {
            data: courses,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };

        await this.cacheManager.set(cacheKey, result, 60 * 1000);

        return result;
    }

    async findMine(userId: string) {
        return this.courseModel
            .find({
                instructor: new Types.ObjectId(userId),
            })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    //    async findAll(query: CourseQueryDto) {
    //     const cacheKey = `courses:${JSON.stringify(query)}`;

    //     const cached = await this.cacheManager.get(cacheKey);

    //     if (cached) {
    //         console.log('Returning courses from cache');
    //         return cached;
    //     }

    //     const {
    //         page = 1,
    //         limit = 10,
    //         search,
    //         status,
    //         sort,
    //     } = query;

    //     const filter: any = {};

    //     if (search) {
    //         filter.$or = [
    //             {
    //                 title: {
    //                     $regex: search,
    //                     $options: 'i',
    //                 },
    //             },
    //             {
    //                 description: {
    //                     $regex: search,
    //                     $options: 'i',
    //                 },
    //             },
    //         ];
    //     }

    //     if (status) {
    //         filter.status = status;
    //     }

    //     let sortOption: any = {
    //         createdAt: -1,
    //     };

    //     if (sort === 'oldest') {
    //         sortOption = { createdAt: 1 };
    //     }

    //     if (sort === 'price_asc') {
    //         sortOption = { price: 1 };
    //     }

    //     if (sort === 'price_desc') {
    //         sortOption = { price: -1 };
    //     }

    //     const skip = (page - 1) * limit;

    //     const [courses, total] = await Promise.all([
    //         this.courseModel
    //             .find(filter)
    //             .populate('instructor', 'name email')
    //             .sort(sortOption)
    //             .skip(skip)
    //             .limit(limit)
    //             .exec(),

    //         this.courseModel.countDocuments(filter),
    //     ]);

    //     const result = {
    //         data: courses,
    //         pagination: {
    //             total,
    //             page,
    //             limit,
    //             totalPages: Math.ceil(total / limit),
    //         },
    //     };

    //     await this.cacheManager.set(
    //         cacheKey,
    //         result,
    //         60 * 1000,
    //     );

    //     return result;
    // }

    async findOne(id: string) {

        const course = await this.courseModel
            .findById(id)
            .populate('instructor', 'name email role')
            .exec();

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        return course;
    }

    async update(
        id: string,
        updateCourseDto: UpdateCourseDto,
        user: any,
    ) {
        const course = await this.courseModel.findById(id);

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (
            user.role === Role.INSTRUCTOR &&
            course.instructor.toString() !== user.sub
        ) {
            throw new ForbiddenException(
                'You can update only your own course',
            );
        }

        Object.assign(course, updateCourseDto);

        return course.save();
    }

    async remove(
        id: string,
        user?: {
            sub: string;
            role: Role;
        },
    ) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid course id');
        }

        const course = await this.courseModel.findById(id);

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (
            user?.role === Role.INSTRUCTOR &&
            course.instructor.toString() !== user.sub
        ) {
            throw new ForbiddenException(
                'You can delete only your own course',
            );
        }

        await this.courseModel.findByIdAndDelete(id);

        return {
            message: 'Course deleted successfully',
        };
    }

    async publish(
        id: string,
        user: {
            sub: string;
            role: Role;
        },
    ) {
        const course = await this.courseModel.findById(id);

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (
            user.role === Role.INSTRUCTOR &&
            course.instructor.toString() !== user.sub
        ) {
            throw new ForbiddenException(
                'You can publish only your own course',
            );
        }

        course.status = 'published';
        await course.save();

        return {
            message: 'Course published successfully',
            course,
        };
    }

    async updateThumbnail(
        courseId: string,
        filename: string,
        user: any,
    ) {
        const course = await this.courseModel.findById(courseId);

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (
            user.role === Role.INSTRUCTOR &&
            course.instructor.toString() !== user.sub
        ) {
            throw new ForbiddenException(
                'You can update thumbnail only for your own course',
            );
        }

        course.thumbnail = filename;

        return course.save();
    }
}
