import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Query, QueryDocument } from 'src/entities/query.entity';
import { TopicQueryXref, TopicQueryXrefDocument } from 'src/entities/topic-query-xref.entity';

@Injectable()
export class QueryService {
  constructor(
    @InjectModel(Query.name) private readonly queryModel: Model<QueryDocument>,
    @InjectModel(TopicQueryXref.name) private readonly topicQueryXrefModel: Model<TopicQueryXrefDocument>,
  ) {}

  public async getQuery(queryId: string): Promise<Query> {
    const query = await this.queryModel.findById(queryId);
    if (query == null) {
      throw new HttpException('Invalid Query', 400);
    }
    return query;
  }

  public async getAllQueries(): Promise<Query[]> {
    return await this.queryModel.find();
  }

  public async createQuery(query: Query, loggedInUser: string): Promise<Query> {
    query['_id'] = new mongoose.Types.ObjectId();
    query.createdBy = loggedInUser;
    query.createdDate = new Date();
    query.active = true;
    query.updatedBy = loggedInUser;
    query.updatedDate = new Date();
    const createdQuery = new this.queryModel(query);
    return await createdQuery.save();
  }

  public async updateQuery(
    queryId: string,
    query: Query,
    loggedInUser: string,
  ): Promise<Query> {
    const queryExist = await this.queryModel.findById(queryId);
    if (queryExist == null) {
      throw new HttpException('Invalid Query', 400);
    }
    return await this.queryModel.findByIdAndUpdate(queryId, {
      queryStr: query.queryStr,
      target: query.target,
      optionType: query.optionType,
      options: query.options,
      updatedBy: loggedInUser,
      updatedDate: new Date(),
    });
  }

  public async toggleQueryById(
    queryId: string,
    loggedInUser: string,
  ): Promise<Query> {
    const query = await this.queryModel.findById(queryId);
    if (query == null) {
      throw new HttpException('Invalid Query', 400);
    }
    return await this.queryModel.findByIdAndUpdate(queryId, {
      active: !query.active,
      updatedBy: loggedInUser,
      updatedDate: new Date(),
    });
  }

  public async deleteQuery(queryId: string): Promise<void> {
    const topic = await this.queryModel.findById(queryId);
    if (topic == null) {
      throw new HttpException('Invalid Query', 400);
    }
    await this.topicQueryXrefModel.deleteMany({ queryId: queryId });
    await this.queryModel.findOneAndDelete({ _id: queryId });
  }
}
