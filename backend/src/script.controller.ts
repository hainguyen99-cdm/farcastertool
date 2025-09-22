import { Body, Controller, Post } from '@nestjs/common';
import { ScriptExecutionService, ScriptAction } from './script-execution.service';

@Controller('scripts')
export class ScriptController {
  constructor(private readonly scriptExecutionService: ScriptExecutionService) {}

  @Post('execute')
  async executeScript(
    @Body() body: { 
      accountId: string; 
      actions: ScriptAction[] 
    }
  ) {
    return await this.scriptExecutionService.executeScript(
      body.accountId, 
      body.actions
    );
  }

  @Post('execute-multiple')
  async executeScriptOnMultipleAccounts(
    @Body() body: { 
      accountIds: string[]; 
      actions: ScriptAction[] 
    }
  ) {
    return await this.scriptExecutionService.executeScriptOnMultipleAccounts(
      body.accountIds, 
      body.actions
    );
  }
}

