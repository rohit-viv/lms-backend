import {
  Injectable,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
} from 'mongoose';

import {
  Course,
  CourseDocument,
} from '../courses/schemas/course.schema';

import {
  User,
  UserDocument,
} from '../users/schemas/user.schema';

import {
  Enrollment,
  EnrollmentDocument,
} from '../enrollments/schemas/enrollment.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  async getAdminStats() {
    const [
      totalCourses,
      totalStudents,
      totalInstructors,
      totalEnrollments,
      publishedCourses,
      draftCourses,
      recentEnrollments,
    ] = await Promise.all([
      this.courseModel.countDocuments(),

      this.userModel.countDocuments({
        role: 'student',
      }),

      this.userModel.countDocuments({
        role: 'instructor',
      }),

      this.enrollmentModel.countDocuments(),

      this.courseModel.countDocuments({
        status: 'published',
      }),

      this.courseModel.countDocuments({
        status: 'draft',
      }),

      this.enrollmentModel
        .find()
        .populate(
          'student',
          'name email',
        )
        .populate(
          'course',
          'title',
        )
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .lean(),
    ]);

    return {
      stats: {
        totalCourses,
        totalStudents,
        totalInstructors,
        totalEnrollments,
      },

      courseStatus: {
        published: publishedCourses,
        draft: draftCourses,
      },

      recentEnrollments,
    };
  }
}