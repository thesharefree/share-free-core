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
    @Query('groupId') groupId: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.askToJoin(groupId, loggedInUser.email);
  }

  @Auth('USER')
  @Delete('/revokeRequest')
  revokeRequest(
    @Req() request: Request,
    @Query('groupId') groupId: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.revokeRequest(groupId, loggedInUser.email);
  }

  @Auth('USER')
  @Get('/requestedUsers')
  requestedUsers(
    @Req() request: Request,
    @Query('groupId') groupId: string,
  ): Promise<User[]> {
    const loggedInUser = request['user'];
    return this.groupUserService.requestedUsers(groupId, loggedInUser.email);
  }

  @Auth('USER')
  @Put('/acceptRequest')
  acceptRequest(
    @Req() request: Request,
    @Query('userId') userId: string,
    @Query('groupId') groupId: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.acceptRequest(
      userId,
      groupId,
      loggedInUser.email,
    );
  }

  @Auth('USER')
  @Put('/rejectRequest')
  rejectRequest(
    @Req() request: Request,
    @Query('userId') userId: string,
    @Query('groupId') groupId: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.rejectRequest(
      userId,
      groupId,
      loggedInUser.email,
    );
  }

  @Auth('USER')
  @Put('/inviteUser')
  inviteUser(
    @Req() request: Request,
    @Query('userId') userId: string,
    @Query('groupId') groupId: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.inviteUser(
      userId,
      groupId,
      loggedInUser.email,
    );
  }

  @Auth('USER')
  @Delete('/revokeInvite')
  revokeInvite(
    @Req() request: Request,
    @Query('userId') userId: string,
    @Query('groupId') groupId: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.revokeInvite(
      userId,
      groupId,
      loggedInUser.email,
    );
  }

  @Auth('USER')
  @Get('/invitedUsers')
  invitedUsers(
    @Req() request: Request,
    @Query('groupId') groupId: string,
  ): Promise<User[]> {
    const loggedInUser = request['user'];
    return this.groupUserService.invitedUsers(groupId, loggedInUser.email);
  }

  @Auth('USER')
  @Put('/acceptInvite')
  acceptInvite(
    @Req() request: Request,
    @Query('groupId') groupId: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.acceptInvite(groupId, loggedInUser.email);
  }

  @Auth('USER')
  @Put('/rejectInvite')
  rejectInvite(
    @Req() request: Request,
    @Query('groupId') groupId: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.rejectInvite(groupId, loggedInUser.email);
  }

  @Auth('USER')
  @Put('/toggleAdmin')
  toggleAdmin(
    @Req() request: Request,
    @Query('userId') userId: string,
    @Query('groupId') groupId: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupUserService.toggleAdmin(
      userId,
      groupId,
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
