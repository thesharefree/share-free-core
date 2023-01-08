import {
  AzureStorageService,
  UploadedFileMetadata,
} from '@nestjs/azure-storage';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from 'src/entities/group.entity';
import {
  UserGroupActions,
  UserGroupActionsDocument,
} from 'src/entities/user-group-actions.entity';
import {
  UserGroupXref,
  UserGroupXrefDocument,
} from 'src/entities/user-group-xref.entity';
import { User, UserDocument } from 'src/entities/user.entity';
import { MessageService } from 'src/modules/message/services/message.service';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(UserGroupXref.name)
    private readonly userGroupXrefModel: Model<UserGroupXrefDocument>,
    @InjectModel(UserGroupActions.name)
    private readonly userGroupActionsModel: Model<UserGroupActionsDocument>,
    private readonly messageService: MessageService,
    private readonly azureStorage: AzureStorageService,
  ) {}

  public async getGroup(groupId: string): Promise<Group> {
    const group = await this.groupModel.findById(groupId);
    if (group == null) {
      throw new HttpException('Invalid Group', 400);
    }
    return group;
  }

  public async createGroup(group: Group, loggedInUser: string): Promise<Group> {
    group['_id'] = null;
    group.owner = loggedInUser;
    group.active = true;
    group.createdBy = loggedInUser;
    group.createdDate = new Date();
    group.updatedBy = loggedInUser;
    group.updatedDate = new Date();
    group.callInProgress = false;
    const createdGroup = new this.groupModel(group);
    const newGroup = await createdGroup.save();
    return newGroup;
  }

  public async updateGroup(
    groupId: string,
    group: Group,
    loggedInUser: string,
  ): Promise<void> {
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    if (extGroup.owner !== loggedInUser) {
      throw new HttpException("You don't own this Group", 400);
    }
    await this.groupModel.updateOne(
      { _id: groupId },
      {
        name: group.name,
        description: group.description,
        houseId: group.houseId,
        latitude: group.latitude,
        longitude: group.longitude,
        city: group.city,
        province: group.province,
        country: group.country,
        updatedBy: loggedInUser,
        updatedDate: new Date(),
      },
    );
  }

  public async updateGroupSchedule(
    groupId: string,
    group: Group,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    const isOwner = extGroup.owner === loggedInUser;
    const xrefResp = await this.userGroupXrefModel.findOne({
      groupId: groupId,
      userId: user._id,
    });
    const isAdmin = xrefResp?.isAdmin;
    if (!isOwner && !isAdmin) {
      throw new HttpException("You don't have admin access to this Group", 400);
    }
    await this.groupModel.updateOne(
      { _id: groupId },
      {
        scheduleType: group.scheduleType,
        scheduleDays: group.scheduleDays,
        scheduleHour: group.scheduleHour,
        scheduleMinute: group.scheduleMinute,
        scheduleTimezone: group.scheduleTimezone,
        updatedBy: loggedInUser,
        updatedDate: new Date(),
      },
    );
  }

  public async updateGroupLanguages(
    groupId: string,
    languages: string,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    const isOwner = extGroup.owner === loggedInUser;
    const xrefResp = await this.userGroupXrefModel.findOne({
      groupId: groupId,
      userId: user._id,
    });
    const isAdmin = xrefResp?.isAdmin;
    if (!isOwner && !isAdmin) {
      throw new HttpException("You don't have admin access to this Group", 400);
    }
    await this.groupModel.updateOne(
      { _id: groupId },
      {
        languages: languages.split(","),
        updatedBy: loggedInUser,
        updatedDate: new Date(),
      },
    );
  }

  public async uploadBanner(
    file: UploadedFileMetadata,
    groupId: string,
    loggedInUser: string,
  ): Promise<void> {
    const group = await this.groupModel.findById(groupId);
    if (group.owner !== loggedInUser) {
      throw new HttpException("You don't own this Group", 400);
    }
    const fileNameParts = file.originalname.split('.');
    const extension = fileNameParts[fileNameParts.length - 1];
    file = {
      ...file,
      originalname: 'group/images/' + group._id.toString() + '.' + extension,
    };
    const storageUrl = await this.azureStorage.upload(file);
    console.log(JSON.stringify(storageUrl));
    await this.groupModel.updateOne(
      { _id: group._id },
      {
        banner: storageUrl,
        updatedBy: loggedInUser,
        updatedDate: new Date(),
      },
    );
  }

  public async toggle(groupId: string, loggedInUser: string): Promise<void> {
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    if (extGroup.owner !== loggedInUser) {
      throw new HttpException("You don't own this Group", 400);
    }
    await this.groupModel.updateOne(
      { _id: groupId },
      {
        active: !extGroup.active,
        updatedDate: new Date(),
      },
    );
  }

  public async callInProgress(
    groupId: string,
    loggedInUser: string,
    callInProgress: boolean,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    const isOwner = extGroup.owner === loggedInUser;
    const xrefResp = await this.userGroupXrefModel.findOne({
      groupId: groupId,
      userId: user._id,
    });
    const isAdmin = xrefResp?.isAdmin;
    if (!isOwner && !isAdmin) {
      throw new HttpException("You don't have admin access to this Group", 400);
    }
    await this.groupModel.updateOne(
      { _id: groupId },
      {
        callInProgress: callInProgress,
      },
    );
    await this.messageService.notifyConference(groupId, callInProgress);
  }

  public async toggleReport(
    groupId: string,
    report: boolean,
    category: string,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    var userGroupActions = await this.userGroupActionsModel.findOne({
      userId: user._id,
      groupId: groupId,
    });
    if (userGroupActions == null) {
      var newUserGroupActions = new UserGroupActions();
      newUserGroupActions.userId = user._id;
      newUserGroupActions.groupId = groupId;
      newUserGroupActions.pinned = false;
      newUserGroupActions.starred = false;
      newUserGroupActions.reported = report;
      newUserGroupActions.reportCategory = category;
      newUserGroupActions.active = true;
      newUserGroupActions.createdBy = loggedInUser;
      newUserGroupActions.createdDate = new Date();
      newUserGroupActions.updatedBy = loggedInUser;
      newUserGroupActions.updatedDate = new Date();
      const createdUserGroupActions = new this.userGroupActionsModel(
        newUserGroupActions,
      );
      await createdUserGroupActions.save();
      return;
    } else {
      await this.userGroupActionsModel.updateOne(
        { _id: userGroupActions._id },
        {
          reported: report,
          reportCategory: category,
          updatedBy: loggedInUser,
          updatedDate: new Date(),
        },
      );
    }
  }

  public async togglePin(
    groupId: string,
    pin: boolean,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    var userGroupActions = await this.userGroupActionsModel.findOne({
      userId: user._id,
      groupId: groupId,
    });
    if (userGroupActions == null) {
      var newUserGroupActions = new UserGroupActions();
      newUserGroupActions.userId = user._id;
      newUserGroupActions.groupId = groupId;
      newUserGroupActions.pinned = pin;
      newUserGroupActions.starred = false;
      newUserGroupActions.reported = false;
      newUserGroupActions.active = true;
      newUserGroupActions.createdBy = loggedInUser;
      newUserGroupActions.createdDate = new Date();
      newUserGroupActions.updatedBy = loggedInUser;
      newUserGroupActions.updatedDate = new Date();
      const createdUserGroupActions = new this.userGroupActionsModel(
        newUserGroupActions,
      );
      await createdUserGroupActions.save();
      return;
    } else {
      await this.userGroupActionsModel.updateOne(
        { _id: userGroupActions._id },
        {
          pinned: pin,
          updatedBy: loggedInUser,
          updatedDate: new Date(),
        },
      );
    }
  }

  public async toggleStar(
    groupId: string,
    star: boolean,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    var userGroupActions = await this.userGroupActionsModel.findOne({
      userId: user._id,
      groupId: groupId,
    });
    if (userGroupActions == null) {
      var newUserGroupActions = new UserGroupActions();
      newUserGroupActions.userId = user._id;
      newUserGroupActions.groupId = groupId;
      newUserGroupActions.pinned = false;
      newUserGroupActions.starred = star;
      newUserGroupActions.reported = false;
      newUserGroupActions.active = true;
      newUserGroupActions.createdBy = loggedInUser;
      newUserGroupActions.createdDate = new Date();
      newUserGroupActions.updatedBy = loggedInUser;
      newUserGroupActions.updatedDate = new Date();
      const createdUserGroupActions = new this.userGroupActionsModel(
        newUserGroupActions,
      );
      await createdUserGroupActions.save();
      return;
    } else {
      await this.userGroupActionsModel.updateOne(
        { _id: userGroupActions._id },
        {
          starred: star,
          updatedBy: loggedInUser,
          updatedDate: new Date(),
        },
      );
    }
  }

  public async userActions(
    groupId: string,
    loggedInUser: string,
  ): Promise<UserGroupActions> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    return await this.userGroupActionsModel.findOne({
      userId: user._id,
      groupId: groupId,
    });
  }
}
