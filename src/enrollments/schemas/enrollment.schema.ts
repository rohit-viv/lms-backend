import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { User } from '../../users/schemas/user.schema';
import { Course } from '../../courses/schemas/course.schema';

export type EnrollmentDocument = HydratedDocument<Enrollment>;

@Schema({ timestamps: true })
export class Enrollment {
    @Prop({
        type: Types.ObjectId,
        ref: User.name,
        required: true,
    })
    student: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: Course.name,
        required: true,
    })
    course: Types.ObjectId;

    @Prop({
        enum: ['active', 'completed', 'cancelled'],
        default: 'active',
    })
    status: string;
    
    @Prop({
        type: [Types.ObjectId],
        ref: 'Lesson',
        default: [],
    })
    completedLessons: Types.ObjectId[];

    @Prop({
        default: 0,
        min: 0,
        max: 100,
    })
    progress: number;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
EnrollmentSchema.index(
    {
        student: 1,
        course: 1,
    },
    {
        unique: true,
    },
);