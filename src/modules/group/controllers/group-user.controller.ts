import {
  Controller,
  Get,
  Req,
  Put,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { Request } from 'express';
import { User } from 'src/entities/user.entity';
import { GroupUserService } from '../services/group-user.service';

@Controller('/group/users')
export class GroupUserController {
  constructor(private readonly groupUserService: GroupUserService) {}

  @Auth('USER')
  @Put('/askToJoin')
  askToJoin(
    @Req() request: Request,
    @Query('groupId') groupIds: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.askToJoin(groupIds, loggedInUser.email);
  }

  @Auth('USER')
  @Delete('/revokeRequest')
  revokeRequest(
    @Req() request: Request,
    @Query('groupId') groupIds: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.revokeRequest(groupIds, loggedInUser.email);
  }

  @Auth('USER')
  @Get('/pendingUsers')
  pendingUsers(@Query('groupId') groupIds: string): Promise<User[]> {
    return this.groupUserService.pendingUsers(groupIds);
  }

  @Auth('USER')
  @Put('/addToGroup')
  addToGroup(
    @Req() request: Request,
    @Query('userId') userId: string,
    @Query('groupId') groupIds: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.addToGroup(
      userId,
      groupIds,
      loggedInUser.email,
    );
  }

  @Auth('USER')
  @Delete('/removeFromGroup')
  removeFromGroup(
    @Req() request: Request,
    @Query('userId') userId: string,
    @Query('groupId') groupId: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.removeFromGroup(
      userId,
      groupId,
      loggedInUser.email,
    );
  }

  @Auth('USER')
  @Delete('/leave')
  leaveGroup(
    @Req() request: Request,
    @Query('groupId') groupId: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.leaveGroup(groupId, loggedInUser.email);
  }

  @Auth('USER')
  @Get('/:groupId')
  getGroupUsers(@Param('groupId') groupId: string): Promise<User[]> {
    return this.groupUserService.getGroupUsers(groupId);
  }
}
