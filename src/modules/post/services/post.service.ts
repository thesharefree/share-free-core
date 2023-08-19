import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  PostTopicXref,
  PostTopicXrefDocument,
} from 'src/entities/post-topic-xref.entity';
import { SFPost, PostDocument } from 'src/entities/post.entity';
import { Topic, TopicDocument } from 'src/entities/topic.entity';
import { Role, User, UserDocument } from 'src/entities/user.entity';
import {
  UserPostActions,
  UserPostActionsDocument,
} from 'src/entities/user-post-actions.entity';
import { UserTopicService } from 'src/modules/user/services/user-topic.service';
import { group } from 'console';
import { MessageService } from 'src/modules/message/services/message.service';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(SFPost.name) private readonly postModel: Model<PostDocument>,
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(PostTopicXref.name)
    private readonly postTopicXrefModel: Model<PostTopicXrefDocument>,
    @InjectModel(UserPostActions.name)
    private readonly userPostActionsModel: Model<UserPostActionsDocument>,
    private readonly userTopicService: UserTopicService,
    private readonly messageService: MessageService,
  ) {}

  public async getAllPosts(
    topicIds: string,
    loggedInUser: string,
  ): Promise<SFPost[]> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    let topics = [];
    if (topicIds == null || topicIds.trim() === '') {
      topics = await this.userTopicService.getUserTopics(loggedInUser);
    } else {
      topics = await this.topicModel
        .find()
        .where('_id')
        .in(topicIds.split(','));
    }
    return await this.postModel.aggregate([
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
        $match: {
          topicIds: {
            $in: topics.map((t) => t['_id']),
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
                  $eq: ['$$this.supported', true],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          likes: {
            $size: {
              $filter: {
                input: '$userActions',
                cond: {
                  $eq: ['$$this.liked', true],
                },
              },
            },
          },
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
        $sort: { supports: -1, likes: -1, createdDate: -1 },
      },
      {
        $unset: ['posters', 'userActions', 'topicXrefs'],
      },
    ]);
  }

  public async getPost(postId: string, loggedInUser: string): Promise<SFPost> {
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
          postId: postId,
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
          supports: {
            $size: {
              $filter: {
                input: '$userActions',
                cond: {
                  $eq: ['$$this.supported', true],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          likes: {
            $size: {
              $filter: {
                input: '$userActions',
                cond: {
                  $eq: ['$$this.liked', true],
                },
              },
            },
          },
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
        $sort: { supports: -1, liked: -1, createdDate: -1 },
      },
      {
        $unset: ['posters', 'userActions', 'topicXrefs'],
      },
    ]);
    return posts[0];
  }

  public async createPost(post: SFPost, loggedInUser: string): Promise<SFPost> {
    post['_id'] = new mongoose.Types.ObjectId();
    post.active = true;
    post.createdBy = loggedInUser;
    post.createdDate = new Date();
    post.updatedBy = loggedInUser;
    post.updatedDate = new Date();
    const createdPost = new this.postModel(post);
    const newPost = await createdPost.save();
    await this.updatePostTopics(
      newPost._id.toString(),
      post.topicIds,
      loggedInUser,
    );
    return newPost;
  }

  private async updatePostTopics(
    postId: string,
    topicIds: string,
    loggedInUser: string,
  ): Promise<void> {
    const topics = await this.topicModel
      .find()
      .where('_id')
      .in(topicIds.split(','));
    await this.postTopicXrefModel.deleteMany({ postId: postId });
    for (const topic of topics) {
      const xref = new PostTopicXref();
      xref.postId = postId;
      xref.topicId = topic._id.toString();
      xref.active = true;
      xref.createdBy = loggedInUser;
      xref.createdDate = new Date();
      xref.updatedBy = loggedInUser;
      xref.updatedDate = new Date();
      const createdPostTopicXref = new this.postTopicXrefModel(xref);
      await createdPostTopicXref.save();
    }
  }

  public async delete(postId: string, loggedInUser: User): Promise<void> {
    const extPost = await this.postModel.findById(postId);
    if (extPost == null) {
      throw new HttpException('Invalid Post', 400);
    }
    if (
      extPost.createdBy !== loggedInUser.email &&
      !loggedInUser.roles.includes(Role.ADMIN)
    ) {
      throw new HttpException("You don't own this Post", 400);
    }
    await this.postModel.updateOne(
      { _id: postId },
      {
        deleted: !extPost.deleted,
        updatedBy: loggedInUser.email,
        updatedDate: new Date(),
      },
    );
  }

  public async toggleLike(
    postId: string,
    loggedInUser: string,
  ): Promise<SFPost> {
    let liked = false;
    const user = await this.userModel.findOne({ email: loggedInUser });
    const extPost = await this.postModel.findById(postId);
    if (extPost == null) {
      throw new HttpException('Invalid Post', 400);
    }
    var userPostActions = await this.userPostActionsModel.findOne({
      userId: user._id,
      postId: postId,
    });
    if (userPostActions == null) {
      liked = true;
      var newUserPostActions = new UserPostActions();
      newUserPostActions.userId = user._id;
      newUserPostActions.postId = postId;
      newUserPostActions.liked = true;
      newUserPostActions.supported = false;
      newUserPostActions.reported = false;
      newUserPostActions.active = true;
      newUserPostActions.createdBy = loggedInUser;
      newUserPostActions.createdDate = new Date();
      newUserPostActions.updatedBy = loggedInUser;
      newUserPostActions.updatedDate = new Date();
      const createdUserPostActions = new this.userPostActionsModel(
        newUserPostActions,
      );
      await createdUserPostActions.save();
    } else {
      liked = !userPostActions.liked;
      await this.userPostActionsModel.updateOne(
        { _id: userPostActions._id },
        {
          liked: !userPostActions.liked,
          updatedBy: loggedInUser,
          updatedDate: new Date(),
        },
      );
    }
    if (liked) {
      await this.messageService.notifyGeneral(
        null,
        `${extPost.content.substring(0, 10)}..`,
        `${user.name} liked your post`,
        [user.registrationToken.toString()],
      );
    }
    return await this.getPost(postId, loggedInUser);
  }

  public async toggleSupport(
    postId: string,
    loggedInUser: string,
  ): Promise<SFPost> {
    let supported = false;
    const user = await this.userModel.findOne({ email: loggedInUser });
    const extPost = await this.postModel.findById(postId);
    if (extPost == null) {
      throw new HttpException('Invalid Post', 400);
    }
    var userPostActions = await this.userPostActionsModel.findOne({
      userId: user._id,
      postId: postId,
    });
    if (userPostActions == null) {
      supported = true;
      var newUserPostActions = new UserPostActions();
      newUserPostActions.userId = user._id;
      newUserPostActions.postId = postId;
      newUserPostActions.liked = false;
      newUserPostActions.supported = true;
      newUserPostActions.reported = false;
      newUserPostActions.active = true;
      newUserPostActions.createdBy = loggedInUser;
      newUserPostActions.createdDate = new Date();
      newUserPostActions.updatedBy = loggedInUser;
      newUserPostActions.updatedDate = new Date();
      const createdUserPostActions = new this.userPostActionsModel(
        newUserPostActions,
      );
      await createdUserPostActions.save();
    } else {
      supported = !userPostActions.supported;
      await this.userPostActionsModel.updateOne(
        { _id: userPostActions._id },
        {
          supported: !userPostActions.supported,
          updatedBy: loggedInUser,
          updatedDate: new Date(),
        },
      );
    }
    if (supported) {
      await this.messageService.notifyGeneral(
        null,
        `${extPost.content.substring(0, 10)}..`,
        `${user.name} liked your post`,
        [user.registrationToken.toString()],
      );
    }
    return await this.getPost(postId, loggedInUser);
  }

  public async toggleReport(
    postId: string,
    report: boolean,
    category: string,
    loggedInUser: string,
  ): Promise<SFPost> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const extPost = await this.postModel.findById(postId);
    if (extPost == null) {
      throw new HttpException('Invalid Post', 400);
    }
    var userPostActions = await this.userPostActionsModel.findOne({
      userId: user._id,
      postId: postId,
    });
    if (userPostActions == null) {
      var newUserPostActions = new UserPostActions();
      newUserPostActions.userId = user._id;
      newUserPostActions.postId = postId;
      newUserPostActions.liked = false;
      newUserPostActions.supported = false;
      newUserPostActions.reported = report;
      newUserPostActions.reportCategory = category;
      newUserPostActions.active = true;
      newUserPostActions.createdBy = loggedInUser;
      newUserPostActions.createdDate = new Date();
      newUserPostActions.updatedBy = loggedInUser;
      newUserPostActions.updatedDate = new Date();
      const createdUserPostActions = new this.userPostActionsModel(
        newUserPostActions,
      );
      await createdUserPostActions.save();
    } else {
      await this.userPostActionsModel.updateOne(
        { _id: userPostActions._id },
        {
          reported: report,
          reportCategory: category,
          updatedBy: loggedInUser,
          updatedDate: new Date(),
        },
      );
    }
    return await this.getPost(postId, loggedInUser);
  }
}
