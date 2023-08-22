import { Controller, Get, Req, Put, Query, Param } from '@nestjs/common';
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
  ): Promise<Topic[]> {
    const loggedInUser = request['user'];
    return this.userTopicService.assignTopics(topicIds, loggedInUser.email);
  }

  @Auth('USER')
  @Get('/:userId')
  getUserTopics(@Param('userId') userId: string): Promise<Topic[]> {
    return this.userTopicService.getUserTopicsByUserId(userId);
  }

  @Auth('USER')
  @Get()
  getMyTopics(@Req() request: Request): Promise<Topic[]> {
    const loggedInUser = request['user'];
    return this.userTopicService.getUserTopics(loggedInUser.email);
  }
}
