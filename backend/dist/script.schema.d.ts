import { ActionType } from './scenario.schema';
export declare class ScriptAction {
    type: ActionType;
    config: Record<string, unknown>;
    order: number;
}
export declare class Script {
    name: string;
    actions: ScriptAction[];
    shuffle: boolean;
    loop: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ScriptSchema: import("mongoose").Schema<Script, import("mongoose").Model<Script, any, any, any, import("mongoose").Document<unknown, any, Script, any, {}> & Script & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Script, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Script>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Script> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
