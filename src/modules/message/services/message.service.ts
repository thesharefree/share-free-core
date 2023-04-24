import { Injectable, HttpException } from '@nestjs/common';
import { User, UserDocument } from 'src/entities/user.entity';
import { defaultApp } from '../../../auth/firebaseAdmin';
import { Group, GroupDocument } from 'src/entities/group.entity';
import {
  Message,
  MessageDocument,
  RecipientType,
} from 'src/entities/message.entity';
import {
  UserGroupXref,
  UserGroupXrefDocument,
} from 'src/entities/user-group-xref.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { messaging } from 'firebase-admin';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(UserGroupXref.name)
    private readonly userGroupXrefModel: Model<UserGroupXrefDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  public async loadChats(loggedInUser: string): Promise<any[]> {
    return this.myGroupChats(loggedInUser).then((chats) => {
      return this.joinedGroupChats(loggedInUser).then((joinedChats) => {
        return chats.concat(joinedChats);
      });
    });
  }

  private async myGroupChats(loggedInUser: string): Promise<any[]> {
    const myGroups = await this.groupModel.find({
      owner: loggedInUser,
      deleted: { $ne: true },
    });
    return await Promise.all(
      myGroups.map(async (group) => {
        const groupMessages = await this.messageModel.find({
          recipientId: group._id,
          recipientType: RecipientType.GROUP,
          createdDate: {
            $gte: group.createdDate,
          },
        });
        return {
          id: group._id,
          name: group.name,
          banner: group.banner,
          type: RecipientType.GROUP,
          messages: groupMessages,
          lastRead: group.ownerMessageLastRead,
        };
      }),
    );
  }

  private async joinedGroupChats(loggedInUser: string): Promise<any[]> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const xrefResp = await this.userGroupXrefModel.find({
      userId: user._id,
      active: true,
    });
    return await Promise.all(
      xrefResp.map(async (xref) => {
        const group = await this.groupModel.findById(xref.groupId);
        if (group.deleted) {
          return null;
        }
        const groupMessages = await this.messageModel.find({
          recipientId: group._id,
          recipientType: RecipientType.GROUP,
          createdDate: {
            $gte: xref.createdDate,
          },
        });
        return {
          id: group._id,
          name: group.name,
          banner: group.banner,
          type: RecipientType.GROUP,
          messages: groupMessages,
          lastRead: xref.messageLastRead,
        };
      }),
    );
  }

  public async lastRead(
    chatId: string,
    chatType: string,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    if (chatType === 'GROUP') {
      const group = await this.groupModel.findById(chatId);
      if (group.owner !== loggedInUser) {
        await this.userGroupXrefModel.updateOne(
          { groupId: chatId, userId: user._id.toString() },
          {
            messageLastRead: new Date(),
            updatedBy: loggedInUser,
            updatedDate: new Date(),
          },
        );
      } else {
        await this.groupModel.updateOne(
          { _id: chatId },
          {
            ownerMessageLastRead: new Date(),
          },
        );
      }
    }
  }

  public async notifyConference(
    groupId: string,
    loggedInUserId: string,
    callInProgress: boolean,
  ) {
    const group = await this.groupModel.findById(groupId);
    const owner = await this.userModel.findOne({ email: group.owner });
    var messagePayload: messaging.MulticastMessage = {
      data: {
        type: 'CONFERENCE',
        title: group.name + ' calling..',
        message: group.name,
        callInProgress: callInProgress.toString(),
        groupId: groupId,
      },
      tokens: [],
    };
    const xrefResp = await this.userGroupXrefModel.find({ groupId: group._id });
    let userIds = xrefResp.map((xref) => {
      return xref.userId;
    });
    userIds.push(owner._id.toString());
    if (userIds.includes(loggedInUserId)) {
      userIds.splice(userIds.indexOf(loggedInUserId), 1);
    }
    const users = await this.userModel.where('_id').in(userIds);
    const userTokens = users.map((user) => {
      return user.registrationToken;
    });
    messagePayload.tokens = userTokens;
    try {
      await defaultApp.messaging().sendMulticast(messagePayload);
    } catch (ex) {
      console.log(JSON.stringify(ex));
    }
  }

  public async notifyJoinGroup(groupId: string) {
    const group = await this.groupModel.findById(groupId);
    if (group == null) {
      throw new HttpException('Invalid group', 400);
    }
    const owner = await this.userModel.findOne({ email: group.owner });
    const xrefResp = await this.userGroupXrefModel.find({ groupId: group._id });
    let excludeUserIds = xrefResp.map((xref) => {
      return xref.userId;
    });
    excludeUserIds.push(owner._id.toString());
    console.log(excludeUserIds);
    const users = await this.userModel.find({
      active: { $ne: false },
    });
    let userTokens = users
      .filter(
        (user) =>
          !excludeUserIds.includes(user._id.toString) &&
          user.registrationToken != null,
      )
      .map((user) => user.registrationToken);
    console.log(userTokens);
    await this.notifyGeneral(
      groupId,
      'Group Announcement',
      `Come join this support group: '${group.name}'`,
      userTokens,
    );
  }

  public async notifyGeneral(
    groupId: string,
    title: string,
    message: string,
    userTokens: string[],
  ) {
    var messagePayload: messaging.MulticastMessage = {
      data: {
        type: 'GENERAL',
        groupId: groupId,
        title: title,
        message: message,
      },
      tokens: userTokens,
    };
    try {
      await defaultApp.messaging().sendMulticast(messagePayload);
    } catch (ex) {
      console.log(JSON.stringify(ex));
    }
  }
}
