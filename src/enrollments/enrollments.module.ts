import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';


import {
  Enrollment,
  EnrollmentSchema,
} from './schemas/enrollment.schema';

import {
  Course,
  CourseSchema,
} from '../courses/schemas/course.schema';

import {
  Lesson,
  LessonSchema,
} from '../lessons/schemas/lesson.schema';

import { AuthModule } from '../auth/auth.module';
import { NotificationClientModule } from '../common/microservices/notification-client.module';

@Module({
  imports: [
    NotificationClientModule,
    AuthModule,
    MongooseModule.forFeature([
      {
        name: Enrollment.name,
        schema: EnrollmentSchema,
      },
      {
        name: Course.name,
        schema: CourseSchema,
      },
      {
        name: Lesson.name,
        schema: LessonSchema,
      },
    ]),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule { }