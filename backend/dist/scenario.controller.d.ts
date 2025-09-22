import { ScenarioService, CreateScenarioInput, UpdateScenarioInput } from './scenario.service';
import { Scenario } from './scenario.schema';
import { ScenarioExecutionService } from './scenario-execution.service';
export declare class ScenarioController {
    private readonly scenarioService;
    private readonly scenarioExecutionService;
    constructor(scenarioService: ScenarioService, scenarioExecutionService: ScenarioExecutionService);
    createScenario(body: CreateScenarioInput): Promise<Scenario>;
    getScenarios(): Promise<Scenario[]>;
    getScenario(id: string): Promise<Scenario>;
    updateScenario(id: string, body: UpdateScenarioInput): Promise<Scenario>;
    deleteScenario(id: string): Promise<{
        deleted: boolean;
    }>;
    reorderActions(id: string, body: {
        orderedActionIds: string[];
    }): Promise<Scenario>;
    moveAction(id: string, actionId: string, body: {
        toIndex: number;
    }): Promise<Scenario>;
    normalizeOrders(id: string): Promise<Scenario>;
    executeScenario(id: string, body: {
        accountIds: string[];
    }): Promise<{
        executed: boolean;
        results: Array<{
            accountId: string;
            loopsRun: number;
        }>;
    }>;
}
