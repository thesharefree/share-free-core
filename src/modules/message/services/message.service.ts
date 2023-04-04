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

  // public async sendMessage(
  //   message: Message,
  //   loggedInUser: string,
  // ): Promise<void> {
  //   const user = await this.userModel.findOne({ email: loggedInUser });
  //   message.sender = user._id;
  //   message.senderName = user.name;
  //   message['_id'] = null;
  //   message.active = true;
  //   message.createdBy = loggedInUser;
  //   message.createdDate = new Date();
  //   message.updatedBy = loggedInUser;
  //   message.updatedDate = new Date();
  //   const createdMessage = new this.messageModel(message);
  //   await createdMessage.save();
  //   var messagePayload: messaging.MulticastMessage = {
  //     data: {
  //       type: 'CHAT',
  //       title: '',
  //       message: message.message,
  //       recipientId: message.recipientId,
  //       recipientType: message.recipientType,
  //       sender: user._id.toString(),
  //       senderName: user.name,
  //       createdBy: loggedInUser,
  //       createdDate: message.createdDate.toISOString(),
  //     },
  //     tokens: [],
  //   };
  //   if (RecipientType.GROUP == message.recipientType) {
  //     const group = await this.groupModel.findById(message.recipientId);
  //     const owner = await this.userModel.findOne({ email: group.owner });
  //     const xrefResp = await this.userGroupXrefModel.find({
  //       groupId: group._id,
  //     });
  //     let userIds = xrefResp.map((xref) => {
  //       return xref.userId;
  //     });
  //     console.log(userIds);
  //     userIds.push(owner._id.toString());
  //     console.log(userIds);
  //     userIds = userIds.filter((userId) => userId != user._id.toString());
  //     console.log(userIds);
  //     const users = await this.userModel.where('_id').in(userIds);
  //     const userTokens = users.map((user) => {
  //       return user.registrationToken;
  //     });
  //     messagePayload.tokens = userTokens;
  //     messagePayload.data.title = group.name;
  //   } else {
  //     const recipient = await this.userModel.findById(message.recipientId);
  //     if (recipient == null) {
  //       throw new HttpException('Invalid User', 400);
  //     }
  //     messagePayload.tokens.push(recipient.registrationToken);
  //     messagePayload.data.title = user.name;
  //   }
  //   try {
  //     await defaultApp.messaging().sendMulticast(messagePayload);
  //   } catch (ex) {
  //     console.log(JSON.stringify(ex));
  //   }
  // }

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
        };
      }),
    );
  }

  // public async loadMessages(
  //   recipientId: string,
  //   recipientType: string,
  //   loggedInUser: string,
  // ): Promise<Message[]> {
  //   const user = await this.userModel.findOne({ email: loggedInUser });
  //   if (recipientType == RecipientType.GROUP) {
  //     const xrefResp = await this.userGroupXrefModel.findOne({
  //       groupId: recipientId,
  //       userId: user._id,
  //       active: true,
  //     });
  //     if (xrefResp == null || !xrefResp.active) {
  //       throw new HttpException("You don't belong in this group", 400);
  //     }
  //     return await this.messageModel.find({
  //       recipientId: recipientId,
  //       recipientType: RecipientType.GROUP,
  //       createdDate: {
  //         $gte: xrefResp.createdDate,
  //       },
  //     });
  //   } else {
  //     return await this.messageModel.find({
  //       $and: [
  //         { recipientType: RecipientType.USER },
  //         { createdDate: { $gte: user.createdDate } },
  //         {
  //           $or: [
  //             { $and: [{ recipientId: recipientId }, { sender: user._id }] },
  //             { $and: [{ recipientId: user._id }, { sender: recipientId }] },
  //           ],
  //         },
  //       ],
  //     });
  //   }
  // }

  public async notifyConference(
    groupId: string,
    loggedInUserId: string,
    callInProgress: boolean,
  ) {
    const group = await this.groupModel.findById(groupId);
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
