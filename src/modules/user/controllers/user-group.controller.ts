import { Controller, Get, Req } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { Request } from 'express';
import { Group } from 'src/entities/group.entity';
import { UserGroupService } from '../services/user-group.service';

@Controller('/user/groups')
export class UserGroupController {
  constructor(private readonly userGroupService: UserGroupService) {}

  @Auth('USER')
  @Get()
  getUserGroups(@Req() request: Request): Promise<Group[]> {
    const loggedInUser = request['user'];
    return this.userGroupService.getUserGroups(loggedInUser.email);
  }

  @Auth('USER')
  @Get('/actioned')
  getUserActionedGroups(@Req() request: Request): Promise<Group[]> {
    const loggedInUser = request['user'];
    return this.userGroupService.getUserActionedGroups(loggedInUser.email);
  }
}
