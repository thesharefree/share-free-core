import { Injectable, HttpException } from '@nestjs/common';
import { Query, QueryDocument } from 'src/entities/query.entity';
import { Topic, TopicDocument } from 'src/entities/topic.entity';
import { TopicQueryXref, TopicQueryXrefDocument } from 'src/entities/topic-query-xref.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class TopicQueryService {

  constructor(
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(Query.name) private readonly queryModel: Model<QueryDocument>,
    @InjectModel(TopicQueryXref.name) private readonly topicQueryXrefModel: Model<TopicQueryXrefDocument>,
  ) { }

  public async toggleQueryXref(topicId: string, queryId: string, loggedInUser: string): Promise<void> {
    const topic = await this.topicModel.findById(topicId);
    if (topic == null) {
      throw new HttpException('Topic does not exist', 400);
    } else {
      const query = await this.queryModel.findById(queryId);
      if (query == null) {
        throw new HttpException('Query does not exist', 400);
      } else {
        const xrefResp = await this.topicQueryXrefModel.findOne({ topicId: topicId, queryId: queryId });
        if (xrefResp != null) {
          await this.topicQueryXrefModel.findOneAndDelete({ topicId: topicId, queryId: queryId });
        } else {
          const xref = this.newTopicQueryXref(topicId, queryId, loggedInUser);
          const createdTopicQueryXref = new this.topicQueryXrefModel(xref);
          await createdTopicQueryXref.save();
        }
      }
    }
  }

  private newTopicQueryXref(topicId: string, queryId: string, loggedInUser: string): TopicQueryXref {
    const xref = new TopicQueryXref();
    xref.queryId = queryId;
    xref.topicId = topicId;
    xref.active = true;
    xref.createdBy = loggedInUser;
    xref.createdDate = new Date();
    xref.updatedBy = loggedInUser;
    xref.updatedDate = new Date();
    return xref;
  }

  public async getTopicQueries(topicId: string): Promise<Query[]> {
    const queryList = await this.queryModel.find().lean();
    const queryXrefList = await this.topicQueryXrefModel.find({ topicId: topicId });
    const finalQueryList = [];
    queryList.forEach((query) => {
      const xrefExist = queryXrefList.filter(xref => xref.queryId == query._id);
      if (xrefExist.length > 0) {
        query.xref = true;
      }
      else {
        query.xref = false;
      }
      finalQueryList.push(query);
    });
    return finalQueryList;
  }
}
