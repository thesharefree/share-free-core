import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SFPost, PostDocument } from 'src/entities/post.entity';
import { User, UserDocument } from 'src/entities/user.entity';

@Injectable()
export class UserPostService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(SFPost.name) private readonly postModel: Model<PostDocument>,
  ) {}

  public async getUserPosts(loggedInUser: string): Promise<SFPost[]> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const posts = await this.postModel.aggregate([
      {
        $match: {
          deleted: {
            $ne: true,
          },
        },
      },
      {
        $addFields: {
          postId: {
            $toString: '$_id',
          },
        },
      },
      {
        $match: {
          createdBy: loggedInUser,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: 'email',
          as: 'posters',
        },
      },
      {
        $addFields: {
          postedBy: {
            $first: '$posters',
          },
        },
      },
      {
        $lookup: {
          from: 'userpostactions',
          localField: 'postId',
          foreignField: 'postId',
          as: 'userActions',
        },
      },
      {
        $addFields: {
          supports: {
            $size: {
              $filter: {
                input: '$userActions',
                cond: {
                  $eq: ['$$this.supports', true],
                },
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'posttopicxrefs',
          localField: 'postId',
          foreignField: 'postId',
          as: 'topicXrefs',
        },
      },
      {
        $addFields: {
          topicIds: {
            $map: {
              input: '$topicXrefs',
              in: {
                $toObjectId: '$$this.topicId',
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'topics',
          localField: 'topicIds',
          foreignField: '_id',
          as: 'topics',
        },
      },
      {
        $lookup: {
          from: 'userpostactions',
          localField: 'postId',
          foreignField: 'postId',
          as: 'userActions',
        },
      },
      {
        $addFields: {
          myActions: {
            $filter: {
              input: '$userActions',
              cond: {
                $eq: ['$$this.userId', user._id.toString()],
              },
            },
          },
        },
      },
      {
        $sort: { supports: -1, createdDate: -1 },
      },
      {
        $unset: ['posters', 'userActions', 'topicXrefs'],
      },
    ]);
    return posts;
  }
}
