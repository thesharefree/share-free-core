import { Controller, Get, Query, Req } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { GroupSearchService } from '../services/group-search.service';
import { GroupView } from 'src/entities/vw_group.entity';

@Controller('/group/search')
export class GroupSearchController {
  constructor(private readonly groupSearchService: GroupSearchService) {}

  @Auth('USER', 'ADMIN')
  @Get()
  searchGroups(@Query('keywords') keywords: string): Promise<GroupView[]> {
    return this.groupSearchService.searchGroups(keywords);
  }
}
