import { Injectable, HttpException } from '@nestjs/common';
import { User, UserDocument } from 'src/entities/user.entity';
import { Group, GroupDocument } from 'src/entities/group.entity';
import {
  UserGroupXref,
  UserGroupXrefDocument,
} from 'src/entities/user-group-xref.entity';
import {
  UserGroupRequestXref,
  UserGroupRequestXrefDocument,
} from 'src/entities/user-group-request-xref.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GroupUserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(UserGroupXref.name)
    private readonly userGroupXrefModel: Model<UserGroupXrefDocument>,
    @InjectModel(UserGroupRequestXref.name)
    private readonly userGroupRequestXrefModel: Model<UserGroupRequestXrefDocument>,
  ) {}

  public async askToJoin(groupId: string, loggedInUser: string): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const group = await this.groupModel.findById(groupId);
    if (group != null) {
      const xrefResp = await this.userGroupRequestXrefModel.findOne({
        userId: user._id,
        groupId: groupId,
      });
      if (xrefResp != null) {
        throw new HttpException('Request already exists', 400);
      } else {
        const xrefResp = await this.userGroupXrefModel.findOne({
          userId: user._id,
          groupId: groupId,
        });
        if (xrefResp != null) {
          throw new HttpException('You are already a member', 400);
        } else {
          const xref = this.newUserGroupRequestXref(
            user._id,
            groupId,
            loggedInUser,
          );
          const createdUserGroupRequestXref =
            new this.userGroupRequestXrefModel(xref);
          await createdUserGroupRequestXref.save();
        }
      }
    }
  }

  public async revokeRequest(
    groupId: string,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const group = await this.groupModel.findById(groupId);
    if (group != null) {
      await this.userGroupRequestXrefModel.deleteOne({
        groupId: group._id,
        userId: user._id,
      });
    }
  }

  public async pendingUsers(groupId: string): Promise<User[]> {
    const group = await this.groupModel.findById(groupId);
    if (group != null) {
      const xrefResp = await this.userGroupRequestXrefModel.find({
        groupId: groupId,
      });
      const userIds = xrefResp.map((xref) => {
        return xref.userId;
      });
      return this.userModel.where('_id').in(userIds);
    } else {
      throw new HttpException('Invalid group', 400);
    }
  }

  public async addToGroup(
    userId: string,
    groupId: string,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (user == null) {
      throw new HttpException('Invalid user', 400);
    } else {
      const group = await this.groupModel.findById(groupId);
      if (group == null) {
        throw new HttpException('Invalid Group', 400);
      } else {
        if (group.owner != loggedInUser) {
          throw new HttpException('You do not own this Group', 400);
        } else {
          const xrefResp = await this.userGroupXrefModel.findOne({
            userId: userId,
            groupId: groupId,
          });
          if (xrefResp != null) {
            throw new HttpException('User is already a member', 400);
          } else {
            var usersCount = await this.userGroupXrefModel
              .find({ groupId: groupId })
              .count();
            if (usersCount >= 15) {
              throw new HttpException('Group can have max 15 members', 400);
            } else {
              const xref = this.newUserGroupXref(userId, groupId, loggedInUser);
              const createdUserGroupXref = new this.userGroupXrefModel(xref);
              await createdUserGroupXref.save();
            }
          }
        }
      }
    }
  }

  private newUserGroupRequestXref(
    userId: string,
    groupId: string,
    loggedInUser: string,
  ): UserGroupRequestXref {
    const xref = new UserGroupRequestXref();
    xref.userId = userId;
    xref.groupId = groupId;
    xref.active = true;
    xref.createdBy = loggedInUser;
    xref.createdDate = new Date();
    xref.updatedBy = loggedInUser;
    xref.updatedDate = new Date();
    return xref;
  }

  private newUserGroupXref(
    userId: string,
    groupId: string,
    loggedInUser: string,
  ): UserGroupXref {
    const xref = new UserGroupXref();
    xref.userId = userId;
    xref.groupId = groupId;
    xref.isAdmin = false;
    xref.active = true;
    xref.createdBy = loggedInUser;
    xref.createdDate = new Date();
    xref.updatedBy = loggedInUser;
    xref.updatedDate = new Date();
    return xref;
  }

  public async toggleAdmin(
    userId: string,
    groupId: string,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (user == null) {
      throw new HttpException('Invalid user', 400);
    }
    const group = await this.groupModel.findById(groupId);
    if (group == null) {
      throw new HttpException('Invalid Group', 400);
    }
    if (group.owner != loggedInUser) {
      throw new HttpException('You do not own this Group', 400);
    }
    const xrefResp = await this.userGroupXrefModel.findOne({
      userId: userId,
      groupId: groupId,
    });
    if (xrefResp == null) {
      throw new HttpException('User is not a member', 400);
    } else {
      this.userGroupXrefModel.updateOne(
        { _id: xrefResp._id },
        {
          isAdmin: !xrefResp.isAdmin,
          updatedBy: loggedInUser,
          updatedDate: new Date(),
        },
      );
    }
  }

  public async removeFromGroup(
    userId: string,
    groupId: string,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (user == null) {
      throw new HttpException('Invalid user', 400);
    } else {
      const group = await this.groupModel.findById(groupId);
      if (group == null) {
        throw new HttpException('Invalid Group', 400);
      } else {
        if (group.owner != loggedInUser) {
          throw new HttpException('You do not own this Group', 400);
        } else {
          await this.userGroupXrefModel.deleteOne({
            userId: userId,
            groupId: groupId,
          });
        }
      }
    }
  }

  public async leaveGroup(
    groupId: string,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findById(loggedInUser);
    const group = await this.groupModel.findById(groupId);
    if (group == null) {
      throw new HttpException('Invalid Group', 400);
    } else {
      if (group.owner != loggedInUser) {
        throw new HttpException('You do not own this Group', 400);
      } else {
        await this.userGroupXrefModel.deleteOne({
          userId: user._id,
          groupId: groupId,
        });
      }
    }
  }

  public async getGroupUsers(groupId: string): Promise<User[]> {
    const group = await this.groupModel.findById(groupId);
    if (group == null) {
      throw new HttpException('Invalid Group', 400);
    } else {
      const owner = await this.userModel.findOne({ email: group.owner });
      const xrefResp = await this.userGroupXrefModel.find({ groupId: groupId });
      const userIds = xrefResp.map((xref) => {
        return xref.userId;
      });
      userIds.push(owner._id);
      const users = await this.userModel.where('_id').in(userIds).lean();
      users.forEach((user) => {
        user.isAdmin =
          xrefResp.find(
            (xref) =>
              xref.userId.toString() === user._id.toString() && xref.isAdmin,
          ) != null;
      });
      return users;
    }
  }
}
