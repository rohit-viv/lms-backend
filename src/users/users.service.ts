import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name)
    private readonly userModel: Model<UserDocument>) { }

    async create(data: {
        name: string;
        email: string;
        password: string;
    }) {
        const user = await this.userModel.create(data);

        return user;
    }

    async findByEmail(email: string) {
        return this.userModel.findOne({ email });
    }
    async findMyProfile(userId: string) {
        const user = await this.userModel
            .findById(userId)
            .select('-password')
            .exec();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateMyProfile(
        userId: string,
        updateProfileDto: UpdateProfileDto,
    ) {
        const user = await this.userModel
            .findByIdAndUpdate(
                userId,
                updateProfileDto,
                {
                    new: true,
                    runValidators: true,
                },
            )
            .select('-password');

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async findAll(query: UserQueryDto) {
        const {
            page = 1,
            limit = 10,
            search,
        } = query;

        const filter: any = {};

        if (search) {
            filter.$or = [
                {
                    name: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    email: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
        }

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.userModel
                .find(filter)
                .select('-password')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec(),

            this.userModel.countDocuments(filter),
        ]);

        return {
            data: users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateRole(
        userId: string,
        role: Role,
    ) {
        const user = await this.userModel
            .findByIdAndUpdate(
                userId,
                { role },
                {
                    new: true,
                    runValidators: true,
                },
            )
            .select('-password');

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateAvatar(
        userId: string,
        filename: string,
    ) {
        const user = await this.userModel
            .findByIdAndUpdate(
                userId,
                {
                    avatar: filename,
                },
                {
                    new: true,
                },
            )
            .select('-password');

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateRefreshToken(
        userId: string,
        hashedRefreshToken: string | null,
    ) {
        return this.userModel.findByIdAndUpdate(
            userId,
            {
                refreshToken: hashedRefreshToken,
            },
            {
                new: true,
            },
        );
    }

    async findById(id: string) {
        return this.userModel.findById(id);
    }

    async updatePassword(
        userId: string,
        hashedPassword: string,
    ) {
        return this.userModel.findByIdAndUpdate(
            userId,
            {
                password: hashedPassword,
            },
        );
    }

    async savePasswordResetToken(
        userId: string,
        token: string,
        expires: Date,
    ) {
        return this.userModel.findByIdAndUpdate(
            userId,
            {
                passwordResetToken: token,
                passwordResetExpires: expires,
            },
        );
    }

    async findByResetToken(token: string) {
        return this.userModel.findOne({
            passwordResetToken: token,
            passwordResetExpires: {
                $gt: new Date(),
            },
        });
    }

    async cleanupExpiredResetTokens() {
        return this.userModel.updateMany(
            {
                passwordResetExpires: {
                    $lt: new Date(),
                },
            },
            {
                $set: {
                    passwordResetToken: null,
                    passwordResetExpires: null,
                },
            },
        );
    }
}
