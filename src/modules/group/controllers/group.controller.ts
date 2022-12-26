import { UploadedFileMetadata } from '@nestjs/azure-storage';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Auth } from 'src/decorators/auth.decorator';
import { Group } from 'src/entities/group.entity';
import { GroupService } from '../services/group.service';

@Controller('/groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Auth('USER')
  @Post('/create')
  createGroup(@Req() request: Request, @Body() group: Group): Promise<Group> {
    const loggedInUser = request['user'];
    return this.groupService.createGroup(group, loggedInUser.email);
  }

  @Auth('USER')
  @Put('/update/:groupId')
  updateGroup(
    @Param('groupId') groupId: string,
    @Req() request: Request,
    @Body() group: Group,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupService.updateGroup(groupId, group, loggedInUser.email);
  }

  @Auth('USER')
  @Post('/uploadBanner/:groupId')
  @UseInterceptors(FileInterceptor('file'))
  uploadBanner(
    @Req() request: Request,
    @Param('groupId') groupId: string,
    @UploadedFile() file: UploadedFileMetadata,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupService.uploadBanner(file, groupId, loggedInUser);
  }

  @Auth('USER')
  @Get('/:groupId')
  getGroup(@Param('groupId') groupId: string): Promise<Group> {
    return this.groupService.getGroup(groupId);
  }

  @Auth('USER')
  @Put('/toggle/:groupId')
  toggleGroup(
    @Param('groupId') groupId: string,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupService.toggle(groupId, loggedInUser.email);
  }

  @Auth('USER')
  @Get('/callInProgress/:groupId')
  callInProgress(
    @Param('groupId') groupId: string,
    @Query('callInProgress') callInProgress: boolean,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupService.callInProgress(groupId, loggedInUser.email, callInProgress);
  }

  @Auth('USER')
  @Post('/report/:groupId')
  reportGroup(
    @Param('groupId') groupId: string,
    @Query('category') category: string,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupService.report(groupId, category, loggedInUser.email);
  }
}
