import { BadRequestException, ConflictException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { Lesson, LessonDocument } from '../lessons/schemas/lesson.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StudentEnrolledEvent } from './events/student-enrolled.event';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class EnrollmentsService {
    constructor(
        @InjectModel(Enrollment.name)
        private readonly enrollmentModel: Model<EnrollmentDocument>,
        @InjectModel(Course.name)
        private readonly courseModel: Model<CourseDocument>,
        @InjectModel(Lesson.name)
        private readonly lessonModel: Model<LessonDocument>,
        private readonly eventEmitter: EventEmitter2,
        @Inject('NOTIFICATION_SERVICE')
        private readonly notificationClient: ClientProxy,
    ) { }

    async enroll(courseId: string, studentId: string) {
        if (!Types.ObjectId.isValid(courseId)) {
            throw new BadRequestException('Invalid course id');
        }

        const course = await this.courseModel.findById(courseId);

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        const existingEnrollment =
            await this.enrollmentModel.findOne({
                student: studentId,
                course: courseId,
            });

        if (existingEnrollment) {
            throw new ConflictException(
                'You are already enrolled in this course',
            );
        }

        const enrollment = await this.enrollmentModel.create({
            student: studentId,
            course: courseId,
        });

        this.eventEmitter.emit(
            'student.enrolled',
            new StudentEnrolledEvent(
                studentId,
                courseId,
                course.title,
            ),
        );

        this.notificationClient.emit(
            'student_enrolled',
            {
                studentId,
                courseId,
                courseTitle: course.title,
            },
        );

        return enrollment;
    }

    async findMyCourses(studentId: string) {
        return this.enrollmentModel
            .find({
                student: studentId,
                status: {
                    $in: ['active', 'completed'],
                },
            })
            .populate({
                path: 'course',
                select: 'title description price status instructor',
                populate: {
                    path: 'instructor',
                    select: 'name email',
                },
            })
            .sort({ createdAt: -1 })
            .exec();
    }

    async completeLesson(
        courseId: string,
        lessonId: string,
        studentId: string,
    ) {
        if (
            !Types.ObjectId.isValid(courseId) ||
            !Types.ObjectId.isValid(lessonId)
        ) {
            throw new BadRequestException('Invalid id');
        }

        const enrollment = await this.enrollmentModel.findOne({
            student: studentId,
            course: courseId,
            status: 'active',
        });

        if (!enrollment) {
            throw new NotFoundException(
                'You are not enrolled in this course',
            );
        }

        const lesson = await this.lessonModel.findOne({
            _id: new Types.ObjectId(lessonId),
            course: new Types.ObjectId(courseId),
        });

        if (!lesson) {
            throw new NotFoundException(
                'Lesson not found in this course',
            );
        }

        const alreadyCompleted = enrollment.completedLessons.some(
            (id) => id.toString() === lessonId,
        );

        if (alreadyCompleted) {
            throw new ConflictException(
                'Lesson already completed',
            );
        }

        enrollment.completedLessons.push(
            new Types.ObjectId(lessonId),
        );

        const totalLessons = await this.lessonModel.countDocuments({
            course: courseId,
        });

        const completedCount =
            enrollment.completedLessons.length;

        const progress =
            totalLessons === 0
                ? 0
                : Math.round(
                    (completedCount / totalLessons) * 100,
                );

        enrollment.progress = progress;

        if (progress === 100) {
            enrollment.status = 'completed';
        }

        await enrollment.save();

        return {
            message: 'Lesson completed successfully',
            progress: enrollment.progress,
            completedLessons: completedCount,
            totalLessons,
            status: enrollment.status,
        };
    }
}
