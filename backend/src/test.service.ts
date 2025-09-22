import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TestDocument } from './test.schema';

@Injectable()
export class TestService {
  constructor(
    @InjectModel(TestDocument.name) private testModel: Model<TestDocument>,
  ) {}

  async createTestDocument(name: string): Promise<TestDocument> {
    const testDoc = new this.testModel({ name });
    return testDoc.save();
  }

  async findAllTestDocuments(): Promise<TestDocument[]> {
    return this.testModel.find().exec();
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test write operation
      const testDoc = await this.createTestDocument('connection-test');
      
      // Test read operation
      const foundDoc = await this.testModel.findById(testDoc._id).exec();
      
      // Clean up test document
      await this.testModel.findByIdAndDelete(testDoc._id).exec();
      
      return foundDoc !== null;
    } catch (error) {
      console.error('MongoDB connection test failed:', error);
      return false;
    }
  }
}
