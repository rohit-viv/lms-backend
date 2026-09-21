import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Course,
  CourseSchema,
} from '../courses/schemas/course.schema';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema';

import {
  Enrollment,
  EnrollmentSchema,
} from '../enrollments/schemas/enrollment.schema';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Course.name,
        schema: CourseSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Enrollment.name,
        schema: EnrollmentSchema,
      },
    ]),
  ],

  controllers: [
    DashboardController,
  ],

  providers: [
    DashboardService,
  ],
})
export class DashboardModule {}