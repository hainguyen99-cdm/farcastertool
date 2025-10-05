import { AccountService, CreateAccountDto, ImportAccountDto, UpdateAccountDto, AddPrivyTokenDto } from './account.service';
export declare class AccountController {
    private readonly accountService;
    constructor(accountService: AccountService);
    getAccounts(): Promise<unknown[]>;
    createAccount(body: CreateAccountDto): Promise<unknown>;
    getAccount(id: string): Promise<unknown>;
    updateAccount(id: string, body: UpdateAccountDto): Promise<unknown>;
    deleteAccount(id: string): Promise<{
        deleted: boolean;
    }>;
    importAccounts(body: {
        accounts: ImportAccountDto[];
    } | ImportAccountDto[]): Promise<{
        success: number;
        errors: string[];
    }>;
    updateWalletAndUsername(id: string): Promise<unknown>;
    addPrivyToken(id: string, body: AddPrivyTokenDto): Promise<unknown>;
    removePrivyToken(id: string, gameLabel: string): Promise<unknown>;
}
