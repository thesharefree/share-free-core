import { Injectable, HttpException } from '@nestjs/common';
import { User, UserDocument } from 'src/entities/user.entity';
import { Query, QueryDocument } from 'src/entities/query.entity';
import {
  UserAnswer,
  UserAnswerDocument,
} from 'src/entities/user-answer.entity';
import {
  TopicQueryXref,
  TopicQueryXrefDocument,
} from 'src/entities/topic-query-xref.entity';
import { UserTopicService } from './user-topic.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UserAnswerService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Query.name) private readonly queryModel: Model<QueryDocument>,
    @InjectModel(TopicQueryXref.name)
    private readonly topicQueryXrefModel: Model<TopicQueryXrefDocument>,
    @InjectModel(UserAnswer.name)
    private readonly userAnswerModel: Model<UserAnswerDocument>,
    private userTopicService: UserTopicService,
  ) {}

  public async updateAnswer(
    queryId: string,
    answer: string,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const query = await this.queryModel.findById(queryId);
    if (query == null) {
      throw new HttpException('Invalid query', 400);
    }
    let userAnswer = await this.userAnswerModel.findOne({
      userId: user._id,
      queryId: queryId,
    });
    if (userAnswer != null) {
      this.userAnswerModel.updateOne(
        { _id: userAnswer._id },
        {
          answer: answer,
          updatedBy: loggedInUser,
          updatedDate: new Date(),
        },
      );
    } else {
      const newUserAnswer = new UserAnswer();
      newUserAnswer.userId = user._id;
      newUserAnswer.queryId = queryId;
      newUserAnswer.answer = answer;
      newUserAnswer.active = true;
      newUserAnswer.createdBy = loggedInUser;
      newUserAnswer.createdDate = new Date();
      newUserAnswer.updatedBy = loggedInUser;
      newUserAnswer.updatedDate = new Date();
      const createdUserAnswer = new this.userAnswerModel(newUserAnswer);
      await createdUserAnswer.save();
    }
  }

  public async userAnswers(email: string): Promise<UserAnswer[]> {
    const user = await this.userModel.findOne({ email: email });
    const userAnswers = await this.userAnswerModel
      .find({ userId: user._id })
      .lean();
    const answeredQueryIds = userAnswers.map((userAnswer) => {
      return userAnswer.queryId;
    });
    const queries = await this.queryModel
      .find()
      .where('_id')
      .in(answeredQueryIds);
    userAnswers.forEach((userAnswer) => {
      const query = queries.find((query) => query._id == userAnswer.queryId);
      userAnswer.queryStr = query.queryStr;
    });
    return userAnswers;
  }

  public async pendingQueries(loggedInUser: string): Promise<Query[]> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    if (user == null) {
      throw new HttpException('Invalid user', 400);
    }
    const topics = await this.userTopicService.getUserTopics(loggedInUser);
    const topicIds = topics.map((topic) => {
      return topic['_id'];
    });
    const xrefs = await this.topicQueryXrefModel
      .find()
      .where('topicId')
      .in(topicIds);
    const queryIds = xrefs.map((xref) => {
      return xref.queryId;
    });
    const userAnswers = await this.userAnswerModel.find({ userId: user._id });
    const answeredQueryIds = userAnswers.map((answer) => {
      return answer.queryId;
    });
    const pendingQueryIds = [];
    queryIds.forEach((queryId) => {
      if (!answeredQueryIds.includes(queryId)) {
        pendingQueryIds.push(queryId);
      }
    });
    return (
      await this.queryModel.find().where('_id').in(pendingQueryIds)
    ).filter((query) => query.target.includes('USER'));
  }

  public async deleteAnswer(
    queryId: string,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    await this.userAnswerModel.deleteOne({
      queryId: queryId,
      userId: user._id,
    });
  }
}
