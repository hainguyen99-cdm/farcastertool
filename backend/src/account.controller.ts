import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AccountService, CreateAccountDto, ImportAccountDto, UpdateAccountDto } from './account.service';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  async getAccounts(): Promise<unknown[]> {
    return await this.accountService.findAll();
  }

  @Post()
  async createAccount(@Body() body: CreateAccountDto): Promise<unknown> {
    return await this.accountService.create(body);
  }

  @Get(':id')
  async getAccount(@Param('id') id: string): Promise<unknown> {
    return await this.accountService.findOne(id);
  }

  @Patch(':id')
  async updateAccount(@Param('id') id: string, @Body() body: UpdateAccountDto): Promise<unknown> {
    return await this.accountService.update(id, body);
  }

  @Delete(':id')
  async deleteAccount(@Param('id') id: string): Promise<{ deleted: boolean }> {
    await this.accountService.remove(id);
    return { deleted: true };
  }

  @Post('import')
  async importAccounts(@Body() body: { accounts: ImportAccountDto[] } | ImportAccountDto[]): Promise<{ success: number; errors: string[] }> {
    const accounts: ImportAccountDto[] = Array.isArray(body)
      ? body
      : Array.isArray((body as { accounts: ImportAccountDto[] })?.accounts)
        ? (body as { accounts: ImportAccountDto[] }).accounts
        : [];
    return await this.accountService.importAccounts(accounts);
  }
}


