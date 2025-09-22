import { Body, Controller, Delete, Get, Param, Post, Put, Patch } from '@nestjs/common';
import { ScenarioService, CreateScenarioInput, UpdateScenarioInput } from './scenario.service';
import { Scenario } from './scenario.schema';
import { ScenarioExecutionService } from './scenario-execution.service';

@Controller('scenarios')
export class ScenarioController {
  constructor(
    private readonly scenarioService: ScenarioService,
    private readonly scenarioExecutionService: ScenarioExecutionService,
  ) {}

  @Post()
  async createScenario(@Body() body: CreateScenarioInput): Promise<Scenario> {
    return await this.scenarioService.createScenario(body);
  }

  @Get()
  async getScenarios(): Promise<Scenario[]> {
    return await this.scenarioService.getScenarios();
  }

  @Get(':id')
  async getScenario(@Param('id') id: string): Promise<Scenario> {
    return await this.scenarioService.getScenarioById(id);
  }

  @Put(':id')
  async updateScenario(@Param('id') id: string, @Body() body: UpdateScenarioInput): Promise<Scenario> {
    return await this.scenarioService.updateScenario(id, body);
  }

  @Delete(':id')
  async deleteScenario(@Param('id') id: string): Promise<{ deleted: boolean }>{
    return await this.scenarioService.deleteScenario(id);
  }

  @Patch(':id/actions/order')
  async reorderActions(
    @Param('id') id: string,
    @Body() body: { orderedActionIds: string[] }
  ): Promise<Scenario> {
    return await this.scenarioService.reorderActionsByIds(id, body.orderedActionIds);
  }

  @Patch(':id/actions/:actionId/move')
  async moveAction(
    @Param('id') id: string,
    @Param('actionId') actionId: string,
    @Body() body: { toIndex: number }
  ): Promise<Scenario> {
    return await this.scenarioService.moveActionToIndex(id, actionId, body.toIndex);
  }

  @Patch(':id/actions/normalize')
  async normalizeOrders(@Param('id') id: string): Promise<Scenario> {
    return await this.scenarioService.normalizeActionOrders(id);
  }

  @Post(':id/execute')
  async executeScenario(
    @Param('id') id: string,
    @Body() body: { accountIds: string[] },
  ): Promise<{ executed: boolean; results: Array<{ accountId: string; loopsRun: number }> }> {
    const accountIds = Array.isArray(body?.accountIds) ? body.accountIds : [];
    const results = await this.scenarioExecutionService.executeScenario(id, accountIds);
    return { executed: true, results };
  }
}


