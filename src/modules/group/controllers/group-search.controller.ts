import { Controller, Get, Query, Req } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { GroupSearchService } from '../services/group-search.service';
import { Group } from 'src/entities/group.entity';

@Controller('/group/search')
export class GroupSearchController {
  constructor(private readonly groupSearchService: GroupSearchService) {}

  @Auth('USER', 'ADMIN')
  @Get()
  searchGroups(@Query('keywords') keywords: string): Promise<Group[]> {
    return this.groupSearchService.searchGroups(keywords);
  }
}
