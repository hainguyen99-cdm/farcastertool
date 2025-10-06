export declare enum AccountStatus {
    ACTIVE = "Active",
    EXPIRED = "Expired",
    ERROR = "Error"
}
export declare class PrivyToken {
    gameLabel: string;
    encryptedPrivyToken: string;
}
export declare class Account {
    name: string;
    encryptedToken: string;
    status: AccountStatus;
    lastUsed: Date;
    error: string;
    walletAddress: string;
    username: string;
    fid: number;
    privyTokens: PrivyToken[];
}
export declare const AccountSchema: import("mongoose").Schema<Account, import("mongoose").Model<Account, any, any, any, import("mongoose").Document<unknown, any, Account, any, {}> & Account & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Account, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Account>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Account> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
