import { Model } from 'mongoose';
import { TestDocument } from './test.schema';
export declare class TestService {
    private testModel;
    constructor(testModel: Model<TestDocument>);
    createTestDocument(name: string): Promise<TestDocument>;
    findAllTestDocuments(): Promise<TestDocument[]>;
    testConnection(): Promise<boolean>;
}
