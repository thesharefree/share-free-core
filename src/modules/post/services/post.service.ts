import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SFPostTopicXref,
  SFPostTopicXrefDocument,
} from 'src/entities/sfpost-topic-xref.entity';
import { SFPost, SFPostDocument } from 'src/entities/sfpost.entity';
import { Topic, TopicDocument } from 'src/entities/topic.entity';
import { Role, User, UserDocument } from 'src/entities/user.entity';
import { UserSFPostActions, UserSFPostActionsDocument } from 'src/entities/user-sfpost-actions.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(SFPost.name) private readonly sfpostModel: Model<SFPostDocument>,
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(SFPostTopicXref.name)
    private readonly sfpostTopicXrefModel: Model<SFPostTopicXrefDocument>,
    @InjectModel(UserSFPostActions.name)
    private readonly userSFPostActionsModel: Model<UserSFPostActionsDocument>,
  ) {}

  public async getAllSFPosts(): Promise<SFPost[]> {
    return await this.sfpostModel.find();
  }

  public async getSFPost(sfpostId: string): Promise<SFPost> {
    const sfpost = await this.sfpostModel.findById(sfpostId);
    if (sfpost == null) {
      throw new HttpException('Invalid Post', 400);
    }
    if (sfpost.deleted) {
      throw new HttpException('Post has been deleted', 400);
    }
    return sfpost;
  }

  public async createSFPost(
    sfpost: SFPost,
    loggedInUser: string,
  ): Promise<SFPost> {
    sfpost['_id'] = null;
    sfpost.active = true;
    sfpost.createdBy = loggedInUser;
    sfpost.createdDate = new Date();
    sfpost.updatedBy = loggedInUser;
    sfpost.updatedDate = new Date();
    const createdSFPost = new this.sfpostModel(sfpost);
    const newSFPost = await createdSFPost.save();
    await this.updatePostTopics(newSFPost._id.toString(), sfpost.topicIds, loggedInUser);
    return newSFPost;
  }

  private async updatePostTopics(
    sfpostId: string,
    topicIds: string,
    loggedInUser: string,
  ): Promise<void> {
    const topics = await this.topicModel
      .find()
      .where('_id')
      .in(topicIds.split(','));
    await this.sfpostTopicXrefModel.deleteMany({ sfpostId: sfpostId });
    for (const topic of topics) {
      const xrefResp = await this.sfpostTopicXrefModel.findOne({
        sfpostId: sfpostId.toString(),
        topicId: topic._id.toString(),
      });
      if (xrefResp == null) {
        const xref = this.newPostTopicXref(
          sfpostId.toString(),
          topic._id.toString(),
          loggedInUser,
        );
        const createdSFPostTopicXref = new this.sfpostTopicXrefModel(xref);
        await createdSFPostTopicXref.save();
      }
    }
  }

  private async newPostTopicXref(
    sfpostId: string,
    topicId: string,
    loggedInUser: string,
  ): Promise<SFPostTopicXref> {
    const xref = new SFPostTopicXref();
    xref.sfpostId = sfpostId;
    xref.topicId = topicId;
    xref.active = true;
    xref.createdBy = loggedInUser;
    xref.createdDate = new Date();
    xref.updatedBy = loggedInUser;
    xref.updatedDate = new Date();
    return xref;
  }

  public async updatePost(
    sfpostId: string,
    sfpost: SFPost,
    loggedInUser: string,
  ): Promise<void> {
    const extSFPost = await this.sfpostModel.findById(sfpostId);
    if (extSFPost == null) {
      throw new HttpException('Invalid Post', 400);
    }
    if (extSFPost.createdBy !== loggedInUser) {
      throw new HttpException("You don't own this Post", 400);
    }
    await this.sfpostModel.updateOne(
      { _id: sfpostId },
      {
        name: sfpost.content,
        latitude: sfpost.latitude,
        longitude: sfpost.longitude,
        city: sfpost.city,
        province: sfpost.province,
        country: sfpost.country,
        updatedBy: loggedInUser,
        updatedDate: new Date(),
      },
    );
    await this.updatePostTopics(sfpostId, sfpost.topicIds, loggedInUser);
  }

  public async delete(sfpostId: string, loggedInUser: User): Promise<void> {
    const extSFPost = await this.sfpostModel.findById(sfpostId);
    if (extSFPost == null) {
      throw new HttpException('Invalid Post', 400);
    }
    if (
      extSFPost.createdBy !== loggedInUser.email &&
      !loggedInUser.roles.includes(Role.ADMIN)
    ) {
      throw new HttpException("You don't own this Post", 400);
    }
    await this.sfpostModel.updateOne(
      { _id: sfpostId },
      {
        deleted: !extSFPost.deleted,
        updatedBy: loggedInUser.email,
        updatedDate: new Date(),
      },
    );
  }

  public async toggleSupport(
    sfpostId: string,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const extPost = await this.sfpostModel.findById(sfpostId);
    if (extPost == null) {
      throw new HttpException('Invalid Post', 400);
    }
    var userPostActions = await this.userSFPostActionsModel.findOne({
      userId: user._id,
      sfpostId: sfpostId,
    });
    if (userPostActions == null) {
      var newUserSFPostActions = new UserSFPostActions();
      newUserSFPostActions.userId = user._id;
      newUserSFPostActions.sfpostId = sfpostId;
      newUserSFPostActions.supported = true;
      newUserSFPostActions.reported = false;
      newUserSFPostActions.active = true;
      newUserSFPostActions.createdBy = loggedInUser;
      newUserSFPostActions.createdDate = new Date();
      newUserSFPostActions.updatedBy = loggedInUser;
      newUserSFPostActions.updatedDate = new Date();
      const createdUserPostActions = new this.userSFPostActionsModel(
        newUserSFPostActions,
      );
      await createdUserPostActions.save();
      return;
    } else {
      await this.userSFPostActionsModel.updateOne(
        { _id: userPostActions._id },
        {
          supported: !userPostActions.supported,
          updatedBy: loggedInUser,
          updatedDate: new Date(),
        },
      );
    }
  }

  public async toggleReport(
    sfpostId: string,
    category: string,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const extSFPost = await this.sfpostModel.findById(sfpostId);
    if (extSFPost == null) {
      throw new HttpException('Invalid Post', 400);
    }
    var userSFPostActions = await this.userSFPostActionsModel.findOne({
      userId: user._id,
      sfpostId: sfpostId,
    });
    if (userSFPostActions == null) {
      var newUserSFPostActions = new UserSFPostActions();
      newUserSFPostActions.userId = user._id;
      newUserSFPostActions.sfpostId = sfpostId;
      newUserSFPostActions.supported = false;
      newUserSFPostActions.reported = true;
      newUserSFPostActions.reportCategory = category;
      newUserSFPostActions.active = true;
      newUserSFPostActions.createdBy = loggedInUser;
      newUserSFPostActions.createdDate = new Date();
      newUserSFPostActions.updatedBy = loggedInUser;
      newUserSFPostActions.updatedDate = new Date();
      const createdUserPostActions = new this.userSFPostActionsModel(
        newUserSFPostActions,
      );
      await createdUserPostActions.save();
      return;
    } else {
      await this.userSFPostActionsModel.updateOne(
        { _id: userSFPostActions._id },
        {
          reported: !userSFPostActions.reported,
          reportCategory: category,
          updatedBy: loggedInUser,
          updatedDate: new Date(),
        },
      );
    }
  }
}
