import { Model } from 'mongoose';
import { Account, AccountStatus } from './account.schema';
import { EncryptionService } from './encryption.service';
export interface CreateAccountDto {
    name: string;
    token: string;
}
export interface UpdateAccountDto {
    name?: string;
    token?: string;
    status?: AccountStatus;
}
export interface ImportAccountDto {
    name: string;
    token: string;
    status?: AccountStatus;
}
export declare class AccountService {
    private accountModel;
    private encryptionService;
    constructor(accountModel: Model<Account>, encryptionService: EncryptionService);
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
}
