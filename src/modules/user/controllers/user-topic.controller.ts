import { Controller, Get, Req, Put, Query } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { Request } from 'express';
import { Topic } from 'src/entities/topic.entity';
import { UserTopicService } from '../services/user-topic.service';

@Controller('/user/topics')
export class UserTopicController {
  constructor(private readonly userTopicService: UserTopicService) {}

  @Auth('USER')
  @Put('/assign')
  assignTopic(
    @Req() request: Request,
    @Query('topicIds') topicIds: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.userTopicService.assignTopics(topicIds, loggedInUser.email);
  }

  @Auth('USER')
  @Get()
  getUserTopics(@Req() request: Request): Promise<Topic[]> {
    const loggedInUser = request['user'];
    return this.userTopicService.getUserTopics(loggedInUser.email);
  }
}
