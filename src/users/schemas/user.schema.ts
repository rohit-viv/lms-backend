// src/users/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    name: string;

    @Prop({
        required: true,
        unique: true,
        lowercase: true,
    })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({
        type: String,
        enum: Role,
        default: Role.STUDENT,
    })
    role: Role;

    @Prop({
        default: null,
    })
    avatar?: string;

    @Prop({
        type: String,
        default: null,
    })
    refreshToken: string | null;

    @Prop({
        type: String,
        default: null,
    })
    passwordResetToken: string | null;

    @Prop({
        type: Date,
        default: null,
    })
    passwordResetExpires: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
