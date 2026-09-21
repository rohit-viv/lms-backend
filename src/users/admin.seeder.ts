import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './schemas/user.schema';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AdminSeeder implements OnModuleInit {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) { }

    async onModuleInit() {
        const email = 'admin@lms.com';

        const existingAdmin = await this.userModel.findOne({ email });

        if (existingAdmin) {
            return;
        }

        const hashedPassword = await bcrypt.hash('Admin@123', 10);

        await this.userModel.create({
            name: 'LMS Admin',
            email,
            password: hashedPassword,
            role: Role.ADMIN,
        });

        console.log('Default admin created');
    }
}