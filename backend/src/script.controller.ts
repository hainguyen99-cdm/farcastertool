import { Body, Controller, Post } from '@nestjs/common';
import { ScriptExecutionService, ScriptAction, ScriptExecutionOptions } from './script-execution.service';

@Controller('scripts')
export class ScriptController {
  constructor(private readonly scriptExecutionService: ScriptExecutionService) {}

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
}

