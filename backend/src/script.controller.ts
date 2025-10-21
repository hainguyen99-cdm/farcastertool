import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { ScriptExecutionService, ScriptAction, ScriptExecutionOptions } from './script-execution.service';
import { AccountService } from './account.service';

@Controller('scripts')
export class ScriptController {
  constructor(
    private readonly scriptExecutionService: ScriptExecutionService,
    private readonly accountService: AccountService
  ) {}

  @Post('execute')
  async executeScript(
    @Body() body: { 
      accountId: string; 
      actions: ScriptAction[];
      options?: ScriptExecutionOptions;
    }
  ) {
    return await this.scriptExecutionService.executeScript(
      body.accountId, 
      body.actions,
      body.options
    );
  }

  @Post('execute-multiple')
  async executeScriptOnMultipleAccounts(
    @Body() body: { 
      accountIds: string[]; 
      actions: ScriptAction[];
      options?: ScriptExecutionOptions;
    }
  ) {
    return await this.scriptExecutionService.executeScriptOnMultipleAccounts(
      body.accountIds, 
      body.actions,
      body.options
    );
  }

  @Get('debug/:accountId/:gameLabel')
  async debugAccountReadiness(
    @Param('accountId') accountId: string,
    @Param('gameLabel') gameLabel: string
  ) {
    const readiness = await this.accountService.checkCreateRecordGameReadiness(accountId, gameLabel);
    const account = await this.accountService.findOne(accountId);
    
    return {
      accountId,
      gameLabel,
      readiness,
      account: {
        id: (account as any)._id?.toString() || accountId,
        name: account.name,
        walletAddress: account.walletAddress,
        privyTokens: account.privyTokens?.map(pt => ({
          gameLabel: pt.gameLabel,
          hasToken: !!pt.encryptedPrivyToken
        })) || []
      }
    };
  }
}

