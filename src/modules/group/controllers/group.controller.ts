import {
  UploadedFileMetadata,
} from '@nestjs/azure-storage';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
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
import { UserGroupActions } from 'src/entities/user-group-actions.entity';
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
  @Put('/updateLanguages/:groupId')
  updateGroupLanguages(
    @Param('groupId') groupId: string,
    @Query('languages') languages: string,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupService.updateGroupLanguages(
      groupId,
      languages,
      loggedInUser.email,
    );
  }

  @Auth('USER')
  @Put('/updateSchedule/:groupId')
  updateGroupSchedule(
    @Param('groupId') groupId: string,
    @Req() request: Request,
    @Body() group: Group,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupService.updateGroupSchedule(
      groupId,
      group,
      loggedInUser.email,
    );
  }

  @Auth('USER')
  @Post('/uploadBanner/:groupId')
  @UseInterceptors(FileInterceptor('file'))
  uploadBanner(
    @Req() request: Request,
    @Param('groupId') groupId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /[\.?\/?]+(gif|jpe?g|tiff?|png|webp|bmp)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 2000000,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: UploadedFileMetadata,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupService.uploadBanner(file, groupId, loggedInUser.email);
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

  @Auth('USER', 'ADMIN')
  @Delete('/delete/:groupId')
  deleteGroup(
    @Param('groupId') groupId: string,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupService.delete(groupId, loggedInUser.email);
  }

  @Auth('USER')
  @Put('/callInProgress/:groupId')
  callInProgress(
    @Param('groupId') groupId: string,
    @Query('callInProgress') callInProgress: boolean,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupService.callInProgress(
      groupId,
      loggedInUser.email,
      callInProgress,
    );
  }

  @Auth('USER', 'ADMIN')
  @Post('/toggleReport/:groupId')
  toggleReport(
    @Param('groupId') groupId: string,
    @Query('report') report: boolean,
    @Query('category') category: string,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupService.toggleReport(
      groupId,
      report,
      category,
      loggedInUser.email,
    );
  }

  @Auth('USER')
  @Post('/togglePin/:groupId')
  togglePin(
    @Param('groupId') groupId: string,
    @Query('pin') pin: boolean,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupService.togglePin(groupId, pin, loggedInUser.email);
  }

  @Auth('USER')
  @Post('/toggleStar/:groupId')
  toggleStar(
    @Param('groupId') groupId: string,
    @Query('star') star: boolean,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupService.toggleStar(groupId, star, loggedInUser.email);
  }

  @Auth('USER')
  @Get('/userActions/:groupId')
  userActions(
    @Param('groupId') groupId: string,
    @Req() request: Request,
  ): Promise<UserGroupActions> {
    const loggedInUser = request['user'];
    return this.groupService.userActions(groupId, loggedInUser.email);
  }
}
