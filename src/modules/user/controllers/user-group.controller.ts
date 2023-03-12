import { Controller, Get, Req } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { Request } from 'express';
import { UserGroupService } from '../services/user-group.service';
import { GroupView } from 'src/entities/vw_group.entity';

@Controller('/user/groups')
export class UserGroupController {
  constructor(private readonly userGroupService: UserGroupService) {}

  @Auth('USER')
  @Get()
  getUserGroups(@Req() request: Request): Promise<GroupView[]> {
    const loggedInUser = request['user'];
    return this.userGroupService.getUserGroups(loggedInUser.email);
  }

  @Auth('USER')
  @Get('/actioned')
  getUserActionedGroups(@Req() request: Request): Promise<GroupView[]> {
    const loggedInUser = request['user'];
    return this.userGroupService.getUserActionedGroups(loggedInUser.email);
  }

  @Auth('USER')
  @Get('/invited')
  getUserInvitedGroups(@Req() request: Request): Promise<GroupView[]> {
    const loggedInUser = request['user'];
    return this.userGroupService.getUserInvitedGroups(loggedInUser.email);
  }
}
