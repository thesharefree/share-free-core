import { Controller, Get, Req } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { GroupSearchService } from '../services/group-search.service';
import { Group } from 'src/entities/group.entity';
import { Request } from 'express';

@Controller('/group/search')
export class GroupSearchController {
  constructor(private readonly groupSearchService: GroupSearchService) { }

  @Auth('USER')
  @Get()
  searchGroups(
    @Req() request: Request): Promise<Group[]> {
    const loggedInUser = request['user'];
    return this.groupSearchService.searchGroups(loggedInUser.email);
  }
}
