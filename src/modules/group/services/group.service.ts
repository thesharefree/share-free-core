import {
  AzureStorageService,
  UploadedFileMetadata,
} from '@nestjs/azure-storage';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Group, GroupDocument } from 'src/entities/group.entity';
import {
  UserGroupActions,
  UserGroupActionsDocument,
} from 'src/entities/user-group-actions.entity';
import {
  UserGroupXref,
  UserGroupXrefDocument,
} from 'src/entities/user-group-xref.entity';
import { Role, User, UserDocument } from 'src/entities/user.entity';
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

  public async getAllGroups(): Promise<Group[]> {
    return await this.groupModel.find({ deleted: { $ne: true } });
  }

  public async getGroup(groupId: string): Promise<Group> {
    const group = await this.groupModel.findById(groupId);
    if (group == null) {
      throw new HttpException('Invalid Group', 400);
    }
    if (group.deleted) {
      throw new HttpException('Group has been deleted', 400);
    }
    if (group.callInProgress) {
      let reset = group.callStarted == null;
      if (!reset) {
        const timeNow = new Date();
        const timeSinceCallStarted =
          timeNow.getTime() - group.callStarted.getTime();
        if (timeSinceCallStarted > 3600000) {
          reset = true;
        }
      }
      if (reset) {
        await this.groupModel.updateOne(
          { _id: groupId },
          {
            callInProgress: false,
            callStarted: null,
            callOffer: null,
          },
        );
        group.callInProgress = false;
        group.callStarted = null;
      }
    }
    return group;
  }

  public async createGroup(group: Group, loggedInUser: string): Promise<Group> {
    const owenedGroups = await this.groupModel.aggregate([
      {
        $match: {
          deleted: {
            $ne: true,
          },
        },
      },
      {
        $match: {
          owner: loggedInUser,
        },
      },
    ]);
    if (owenedGroups.length >= 40) {
      throw new HttpException('You cannot own more than 40 groups', 400);
    }
    if (group.houseId) {
      const groupsInHouses = await this.groupModel.aggregate([
        {
          $match: {
            deleted: {
              $ne: true,
            },
          },
        },
        {
          $match: {
            houseId: group.houseId,
          },
        },
      ]);
      if (groupsInHouses.length >= 20) {
        throw new HttpException(
          'You cannot create more than 20 groups in a house',
          400,
        );
      }
    }
    group['_id'] = new mongoose.Types.ObjectId();
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
  ): Promise<Group> {
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    if (extGroup.owner !== loggedInUser) {
      throw new HttpException("You don't own this Group", 400);
    }
    if (group.houseId) {
      const groupsInHouses = await this.groupModel.aggregate([
        {
          $match: {
            deleted: {
              $ne: true,
            },
          },
        },
        {
          $match: {
            houseId: group.houseId,
          },
        },
      ]);
      if (groupsInHouses.length >= 20) {
        throw new HttpException(
          'You cannot have more than 20 groups in a house',
          400,
        );
      }
    }
    await this.groupModel.updateOne(
      { _id: groupId },
      {
        name: group.name,
        description: group.description,
        houseId: group.houseId,
        inviteOnly: group.inviteOnly,
        latitude: group.latitude,
        longitude: group.longitude,
        city: group.city,
        province: group.province,
        country: group.country,
        updatedBy: loggedInUser,
        updatedDate: new Date(),
      },
    );
    return await this.getGroup(groupId);
  }

  public async updateGroupSchedule(
    groupId: string,
    group: Group,
    loggedInUser: string,
  ): Promise<Group> {
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
    return await this.getGroup(groupId);
  }

  public async updateGroupLanguages(
    groupId: string,
    languages: string,
    loggedInUser: string,
  ): Promise<Group> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    if (languages.split(',').length > 5) {
      throw new HttpException('Please select a maximum of 5 languages', 400);
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
        languages: languages.split(','),
        updatedBy: loggedInUser,
        updatedDate: new Date(),
      },
    );
    return await this.getGroup(groupId);
  }

  public async uploadBanner(
    file: UploadedFileMetadata,
    groupId: string,
    loggedInUser: string,
  ): Promise<Group> {
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
    await this.groupModel.updateOne(
      { _id: group._id },
      {
        banner: storageUrl.split('?')[0],
        updatedBy: loggedInUser,
        updatedDate: new Date(),
      },
    );
    return await this.getGroup(groupId);
  }

  public async toggle(groupId: string, loggedInUser: User): Promise<void> {
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    if (extGroup.owner !== loggedInUser.email &&
      !loggedInUser.roles.includes(Role.ADMIN)) {
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

  public async delete(groupId: string, loggedInUser: User): Promise<void> {
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    if (
      extGroup.owner !== loggedInUser.email &&
      !loggedInUser.roles.includes(Role.ADMIN)
    ) {
      throw new HttpException("You don't own this Group", 400);
    }
    await this.groupModel.updateOne(
      { _id: groupId },
      {
        deleted: true,
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
        callStarted: callInProgress ? new Date() : null,
      },
    );
    await this.messageService.notifyConference(
      groupId,
      user._id.toString(),
      callInProgress,
    );
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
