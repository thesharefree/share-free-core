import { Controller, Get, Req } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { Request } from 'express';
import { Group } from 'src/entities/group.entity';
import { UserGroupService } from '../services/user-group.service';

@Controller('/user/groups')
export class UserGroupController {
  constructor(private readonly userGroupService: UserGroupService) {}

  @Get()
  @Auth('USER')
  getUserGroups(@Req() request: Request): Promise<Group[]> {
    const loggedInUser = request['user'];
    return this.userGroupService.getUserGroups(loggedInUser.email);
  }
}
