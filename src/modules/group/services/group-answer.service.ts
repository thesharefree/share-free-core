import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GroupAnswer, GroupAnswerDocument } from 'src/entities/group-answer.entity';
import { Group, GroupDocument } from 'src/entities/group.entity';
import { Query, QueryDocument } from 'src/entities/query.entity';
import { TopicQueryXref, TopicQueryXrefDocument } from 'src/entities/topic-query-xref.entity';
import { GroupTopicService } from './group-topic.service';

@Injectable()
export class GroupAnswerService {

  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(Query.name) private readonly queryModel: Model<QueryDocument>,
    @InjectModel(TopicQueryXref.name) private readonly topicQueryXrefModel: Model<TopicQueryXrefDocument>,
    @InjectModel(GroupAnswer.name) private readonly groupAnswerModel: Model<GroupAnswerDocument>,
    private groupTopicService: GroupTopicService
  ) { }

  public async updateAnswer(groupId: string, queryId: string, answer: string, loggedInUser: string): Promise<void> {
    const group = await this.groupModel.findById(groupId);
    if (group == null) {
      throw new HttpException('Invalid group', 400);
    } else {
      const query = await this.queryModel.findById(queryId);
      if (query == null) {
        throw new HttpException('Invalid query', 400);
      } else {
        let groupAnswer = await this.groupAnswerModel.findOne({ groupId: group._id, queryId: queryId });
        if (groupAnswer != null) {
          this.groupAnswerModel.updateOne({ _id: groupAnswer._id }, {
            answer: answer,
            updatedBy: loggedInUser,
            updatedDate: new Date()
          });
        } else {
          const newGroupAnswer = new GroupAnswer();
          newGroupAnswer.groupId = group._id;
          newGroupAnswer.queryId = queryId;
          newGroupAnswer.answer = answer;
          newGroupAnswer.active = true;
          newGroupAnswer.createdBy = loggedInUser;
          newGroupAnswer.createdDate = new Date();
          newGroupAnswer.updatedBy = loggedInUser;
          newGroupAnswer.updatedDate = new Date();
          const createdGroupAnswer = new this.groupAnswerModel(newGroupAnswer);
          await createdGroupAnswer.save();
        }
      }
    }
  }

  public async groupAnswers(groupId: string): Promise<GroupAnswer[]> {
    const group = await this.groupModel.findById(groupId);
    if (group == null) {
      throw new HttpException('Invalid group', 400);
    } else {
      const groupAnswers = await this.groupAnswerModel.find({ groupId: group._id }).lean();
      const answeredQueryIds = groupAnswers.map(groupAnswer => { return groupAnswer.queryId; });
      const queries = await this.queryModel.find().where('_id').in(answeredQueryIds);
      groupAnswers.forEach(groupAnswer => {
        const query = queries.find(query => query._id == groupAnswer.queryId);
        groupAnswer.queryStr = query.queryStr;
      });
      return groupAnswers;
    }
  }

  public async pendingQueries(groupId: string): Promise<Query[]> {
    const group = await this.groupModel.findById(groupId);
    if (group == null) {
      throw new HttpException('Invalid group', 400);
    } else {
      const topics = await this.groupTopicService.getGroupTopics(groupId);
      const topicIds = topics.map(topic => { return topic['_id']; });
      const xrefs = await this.topicQueryXrefModel.find().where('topicId').in(topicIds);
      const queryIds = xrefs.map(xref => { return xref.queryId });
      const groupAnswers = await this.groupAnswerModel.find({ groupId: group._id });
      const answeredQueryIds = groupAnswers.map(answer => { return answer.queryId });
      const pendingQueryIds = [];
      queryIds.forEach(queryId => {
        if (!answeredQueryIds.includes(queryId)) {
          pendingQueryIds.push(queryId);
        }
      });
      return (await (this.queryModel.find().where('_id').in(pendingQueryIds))).filter(query => query.target.includes('GROUP'));
    }
  }

  public async deleteAnswer(groupId: string, queryId: string): Promise<void> {
    const group = await this.groupModel.findById(groupId);
    if (group == null) {
      throw new HttpException('Invalid group', 400);
    } else {
      await this.groupAnswerModel.deleteOne({ groupId: group._id, queryId: queryId });
    }
  }

}
