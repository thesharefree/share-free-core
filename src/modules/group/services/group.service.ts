import {
  AzureStorageService,
  UploadedFileMetadata,
} from '@nestjs/azure-storage';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from 'src/entities/group.entity';
import { MessageService } from 'src/modules/message/services/message.service';

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

  public async callInProgress(
    groupId: string,
    loggedInUser: string,
    callInProgress: boolean,
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
        callInProgress: callInProgress,
      },
    );
    await this.messageService.notifyConference(groupId, callInProgress);
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
