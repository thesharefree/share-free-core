import { Controller, Get, Param, Put, Query, Req } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { Query as QueryEntity } from 'src/entities/query.entity';
import { Request } from 'express';
import { TopicQueryService } from '../services/topic-query.service';

@Controller('/topic/queries')
export class TopicQueryController {
  constructor(private readonly topicQueryService: TopicQueryService) {}

  @Auth('ADMIN')
  @Put('/toggle')
  assignQuery(
    @Req() request: Request,
    @Query('topicId') topicId: string,
    @Query('queryId') queryId: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.topicQueryService.toggleQueryXref(
      topicId,
      queryId,
      loggedInUser.email,
    );
  }

  @Auth('ADMIN')
  @Get('/:topicId')
  getTopicQueries(@Param('topicId') topicId: string): Promise<QueryEntity[]> {
    return this.topicQueryService.getTopicQueries(topicId);
  }
}
