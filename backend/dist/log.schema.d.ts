import { Types } from 'mongoose';
import { ActionType } from './scenario.schema';
export declare enum LogStatus {
    SUCCESS = "Success",
    FAILURE = "Failure"
}
export declare class Log {
    accountId: Types.ObjectId;
    scenarioId: Types.ObjectId;
    actionType: ActionType;
    status: LogStatus;
    error: string;
    result: Record<string, unknown>;
    timestamp: Date;
}
export declare const LogSchema: import("mongoose").Schema<Log, import("mongoose").Model<Log, any, any, any, import("mongoose").Document<unknown, any, Log, any, {}> & Log & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Log, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Log>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Log> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
