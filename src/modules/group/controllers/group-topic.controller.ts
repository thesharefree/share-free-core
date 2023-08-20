import { Controller, Get, Req, Put, Query, Param } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { Request } from 'express';
import { Topic } from 'src/entities/topic.entity';
import { GroupTopicService } from '../services/group-topic.service';

@Controller('/group/topics')
export class GroupTopicController {
  constructor(private readonly groupTopicService: GroupTopicService) {}

  @Auth('USER')
  @Put('/assign')
  assignTopics(
    @Req() request: Request,
    @Query('groupId') groupId: string,
    @Query('topicIds') topicIds: string,
  ): Promise<Topic[]> {
    const loggedInUser = request['user'];
    return this.groupTopicService.assignTopics(
      groupId,
      topicIds,
      loggedInUser.email,
    );
  }

  @Auth('USER')
  @Get('/:groupId')
  getGroupTopics(@Param('groupId') groupId: string): Promise<Topic[]> {
    return this.groupTopicService.getGroupTopics(groupId);
  }
}
