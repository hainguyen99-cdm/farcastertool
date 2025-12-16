export declare enum ActionType {
    GET_FEED = "GetFeed",
    LIKE_CAST = "LikeCast",
    RECAST_CAST = "RecastCast",
    PIN_MINI_APP = "PinMiniApp",
    DELAY = "Delay",
    JOIN_CHANNEL = "JoinChannel",
    FOLLOW_USER = "FollowUser",
    UPDATE_WALLET = "UpdateWallet",
    CREATE_WALLET = "CreateWallet",
    CREATE_RECORD_GAME = "CreateRecordGame",
    CREATE_CAST = "CreateCast",
    MINI_APP_EVENT = "MiniAppEvent",
    ANALYTICS_EVENTS = "AnalyticsEvents"
}
export type ActionConfig = Record<string, unknown>;
export declare class Action {
    type: ActionType;
    config: ActionConfig;
    order: number;
}
export declare class Scenario {
    name: string;
    actions: Action[];
    shuffle: boolean;
    loop: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ScenarioSchema: import("mongoose").Schema<Scenario, import("mongoose").Model<Scenario, any, any, any, import("mongoose").Document<unknown, any, Scenario, any, {}> & Scenario & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Scenario, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Scenario>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Scenario> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
