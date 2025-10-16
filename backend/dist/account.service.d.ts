import { Model } from 'mongoose';
import { Account, AccountStatus } from './account.schema';
import { EncryptionService } from './encryption.service';
import { FarcasterService } from './farcaster.service';
export interface CreateAccountDto {
    name: string;
    token: string;
}
export interface UpdateAccountDto {
    name?: string;
    token?: string;
    status?: AccountStatus;
    privyTokens?: PrivyTokenDto[];
}
export interface ImportAccountDto {
    name: string;
    token: string;
    status?: AccountStatus;
}
export interface PrivyTokenDto {
    gameLabel: string;
    privyToken: string;
}
export interface AddPrivyTokenDto {
    gameLabel: string;
    privyToken: string;
}
export declare class AccountService {
    private accountModel;
    private encryptionService;
    private farcasterService;
    constructor(accountModel: Model<Account>, encryptionService: EncryptionService, farcasterService: FarcasterService);
    create(createAccountDto: CreateAccountDto): Promise<Account>;
    findAll(): Promise<Account[]>;
    findOne(id: string): Promise<Account>;
    update(id: string, updateAccountDto: UpdateAccountDto): Promise<Account>;
    remove(id: string): Promise<void>;
    getDecryptedToken(id: string): Promise<string>;
    updateLastUsed(id: string): Promise<void>;
    updateStatus(id: string, status: AccountStatus, error?: string): Promise<Account>;
    importAccounts(accounts: ImportAccountDto[]): Promise<{
        success: number;
        errors: string[];
    }>;
    updateWalletAndUsername(id: string): Promise<Account>;
    updateWalletAddress(id: string, walletAddress: string): Promise<Account>;
    addPrivyToken(id: string, addPrivyTokenDto: AddPrivyTokenDto): Promise<Account>;
    removePrivyToken(id: string, gameLabel: string): Promise<Account>;
    getDecryptedPrivyToken(id: string, gameLabel: string): Promise<string>;
}
