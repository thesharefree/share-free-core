import {
  AzureStorageService,
  UploadedFileMetadata,
} from '@nestjs/azure-storage';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';
import { Model } from 'mongoose';
import { Group, GroupDocument } from 'src/entities/group.entity';
import { MessageService } from 'src/modules/message/services/message.service';

const appID = '991cd87a4118415997443c40c06156a7';
const appCertificate = 'de0ea8e1b9d6432d9726b73dedd9cfa0';
const role = RtcRole.PUBLISHER;

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
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

  public async conferenceToken(
    groupId: string,
    loggedInUser: string,
  ): Promise<string> {
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    if (extGroup.owner !== loggedInUser) {
      throw new HttpException("You don't own this Group", 400);
    }
    const dateNow = Date.now();
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(dateNow / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    const rtcExpiry = new Date(privilegeExpiredTs * 1000);
    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      extGroup._id.toString(),
      0,
      role,
      privilegeExpiredTs,
    );
    await this.groupModel.updateOne(
      { _id: groupId },
      {
        rtcToken: rtcToken,
        rtcExpiry: rtcExpiry,
      },
    );
    await this.messageService.notifyConference(groupId, rtcToken);
    return rtcToken;
  }

  public async report(
    groupId: string,
    category: string,
    loggedInUser: string,
  ): Promise<void> {
    const extGroup = await this.groupModel.findById(groupId);
    if (extGroup == null) {
      throw new HttpException('Invalid Group', 400);
    }
    // create group report created by loggedInUser
  }
}
