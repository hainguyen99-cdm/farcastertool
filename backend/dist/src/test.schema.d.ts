import { Document } from 'mongoose';
export declare class TestDocument extends Document {
    name: string;
    createdAt: Date;
}
export declare const TestSchema: import("mongoose").Schema<TestDocument, import("mongoose").Model<TestDocument, any, any, any, Document<unknown, any, TestDocument, any, {}> & TestDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TestDocument, Document<unknown, {}, import("mongoose").FlatRecord<TestDocument>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<TestDocument> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
