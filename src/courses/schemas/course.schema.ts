import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type CourseDocument = HydratedDocument<Course>;

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 0 })
  price: number;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  instructor: Types.ObjectId;

  @Prop({
    enum: ['draft', 'published'],
    default: 'draft',
  })
  status: string;

  @Prop({
    default: null,
  })
  thumbnail?: string;
}

export const CourseSchema = SchemaFactory.createForClass(Course);