import { Types } from 'mongoose';
export declare enum GameRecordStatus {
    UNUSED = "Unused",
    USED = "Used"
}
export declare class GameRecord {
    accountId: Types.ObjectId;
    gameLabel: string;
    recordId?: string;
    gameId?: string;
    wallet?: string;
    signature?: string;
    points?: number;
    nonce?: number;
    status: GameRecordStatus;
    apiResponse: Record<string, unknown>;
    createdAt: Date;
}
export declare const GameRecordSchema: import("mongoose").Schema<GameRecord, import("mongoose").Model<GameRecord, any, any, any, import("mongoose").Document<unknown, any, GameRecord, any, {}> & GameRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, GameRecord, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<GameRecord>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<GameRecord> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
