import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<Account>,
    private encryptionService: EncryptionService,
  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const encryptedToken = this.encryptionService.encrypt(createAccountDto.token);
    
    const account = new this.accountModel({
      name: createAccountDto.name,
      encryptedToken,
      status: AccountStatus.ACTIVE,
    });

    return account.save();
  }

  async findAll(): Promise<Account[]> {
    return this.accountModel.find().exec();
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.accountModel.findById(id).exec();
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    return account;
  }

  async update(id: string, updateAccountDto: UpdateAccountDto): Promise<Account> {
    const updateData: any = { ...updateAccountDto };
    
    if (updateAccountDto.token) {
      updateData.encryptedToken = this.encryptionService.encrypt(updateAccountDto.token);
      delete updateData.token;
    }

    const account = await this.accountModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async remove(id: string): Promise<void> {
    const result = await this.accountModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
  }

  async getDecryptedToken(id: string): Promise<string> {
    const account = await this.findOne(id);
    return this.encryptionService.decrypt(account.encryptedToken);
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.accountModel.findByIdAndUpdate(id, { lastUsed: new Date() }).exec();
  }

  async updateStatus(id: string, status: AccountStatus, error?: string): Promise<Account> {
    const updateData: any = { status };
    if (error) {
      updateData.error = error;
    }

    const account = await this.accountModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async importAccounts(accounts: ImportAccountDto[]): Promise<{ success: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;

    for (const accountData of accounts) {
      try {
        const encryptedToken = this.encryptionService.encrypt(accountData.token);
        
        const account = new this.accountModel({
          name: accountData.name,
          encryptedToken,
          status: accountData.status || AccountStatus.ACTIVE,
        });

        await account.save();
        success++;
      } catch (error) {
        errors.push(`Failed to import account "${accountData.name}": ${error.message}`);
      }
    }

    return { success, errors };
  }
}

