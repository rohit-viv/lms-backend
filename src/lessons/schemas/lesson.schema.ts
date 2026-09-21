import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Course } from '../../courses/schemas/course.schema';

export type LessonDocument = HydratedDocument<Lesson>;

@Schema({ timestamps: true })
export class Lesson {
    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ required: true })
    content: string;

    @Prop({
        type: Types.ObjectId,
        ref: Course.name,
        required: true,
    })
    course: Types.ObjectId;

    @Prop({ default: 1 })
    order: number;

    @Prop({ default: false })
    isPublished: boolean;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);