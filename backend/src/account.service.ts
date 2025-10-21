import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, AccountStatus, PrivyToken } from './account.schema';
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

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<Account>,
    private encryptionService: EncryptionService,
    private farcasterService: FarcasterService,
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

    // Handle privy tokens if they exist in the update data
    if (updateAccountDto.privyTokens) {
      const encryptedPrivyTokens = updateAccountDto.privyTokens.map(pt => ({
        gameLabel: pt.gameLabel,
        encryptedPrivyToken: this.encryptionService.encrypt(pt.privyToken)
      }));
      updateData.privyTokens = encryptedPrivyTokens;
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

  async updateWalletAndUsername(id: string): Promise<Account> {
    const account = await this.findOne(id);
    
    try {
      const { walletAddress, username, fid } = await this.farcasterService.getOnboardingState(account.encryptedToken);
      
      const updatedAccount = await this.accountModel
        .findByIdAndUpdate(
          id,
          { 
            walletAddress,
            username,
            fid,
            lastUsed: new Date(),
          },
          { new: true }
        )
        .exec();

      if (!updatedAccount) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }

      return updatedAccount;
    } catch (error) {
      // Update account status to error if the API call fails
      await this.updateStatus(id, AccountStatus.ERROR, `Failed to update wallet and username: ${error.message}`);
      throw error;
    }
  }

  async updateWalletAddress(id: string, walletAddress: string): Promise<Account> {
    const updatedAccount = await this.accountModel
      .findByIdAndUpdate(
        id,
        { 
          walletAddress,
          lastUsed: new Date(),
        },
        { new: true }
      )
      .exec();

    if (!updatedAccount) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return updatedAccount;
  }

  async addPrivyToken(id: string, addPrivyTokenDto: AddPrivyTokenDto): Promise<Account> {
    const account = await this.findOne(id);
    
    const encryptedPrivyToken = this.encryptionService.encrypt(addPrivyTokenDto.privyToken);
    
    const privyToken: PrivyToken = {
      gameLabel: addPrivyTokenDto.gameLabel,
      encryptedPrivyToken,
    };
    
    const updatedAccount = await this.accountModel
      .findByIdAndUpdate(
        id,
        { 
          $push: { 
            privyTokens: {
              gameLabel: privyToken.gameLabel,
              encryptedPrivyToken: privyToken.encryptedPrivyToken
            }
          } 
        },
        { new: true }
      )
      .exec();

    if (!updatedAccount) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    return updatedAccount;
  }

  async removePrivyToken(id: string, gameLabel: string): Promise<Account> {
    const account = await this.findOne(id);
    
    const updatedAccount = await this.accountModel
      .findByIdAndUpdate(
        id,
        { $pull: { privyTokens: { gameLabel } } },
        { new: true }
      )
      .exec();

    if (!updatedAccount) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return updatedAccount;
  }

  async getDecryptedPrivyToken(id: string, gameLabel: string): Promise<string> {
    const account = await this.findOne(id);
    const privyToken = account.privyTokens.find(pt => pt.gameLabel === gameLabel);
    
    if (!privyToken) {
      throw new NotFoundException(`Privy token with game label "${gameLabel}" not found for account ${id}`);
    }
    
    return this.encryptionService.decrypt(privyToken.encryptedPrivyToken);
  }

  /**
   * Check if an account is ready for CREATE_RECORD_GAME action
   * @param id - Account ID
   * @param gameLabel - Game label to check
   * @returns Promise<{ ready: boolean; issues: string[] }>
   */
  async checkCreateRecordGameReadiness(id: string, gameLabel: string): Promise<{ ready: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      const account = await this.findOne(id);
      
      if (!account.walletAddress) {
        issues.push('Account has no wallet address');
      }
      
      if (!account.privyTokens || account.privyTokens.length === 0) {
        issues.push('Account has no privy tokens');
      } else {
        const hasGameToken = account.privyTokens.some(pt => pt.gameLabel === gameLabel);
        if (!hasGameToken) {
          issues.push(`No privy token found for game label "${gameLabel}"`);
        }
      }
      
      return {
        ready: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        ready: false,
        issues: [`Account not found: ${error.message}`]
      };
    }
  }
}

