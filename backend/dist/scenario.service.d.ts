import { Model } from 'mongoose';
import { Scenario } from './scenario.schema';
export interface CreateScenarioInput {
    readonly name: string;
    readonly actions?: Scenario['actions'];
    readonly shuffle?: boolean;
    readonly loop?: number;
}
export interface UpdateScenarioInput {
    readonly name?: string;
    readonly actions?: Scenario['actions'];
    readonly shuffle?: boolean;
    readonly loop?: number;
}
export declare class ScenarioService {
    private readonly scenarioModel;
    constructor(scenarioModel: Model<Scenario>);
    createScenario(input: CreateScenarioInput): Promise<Scenario>;
    getScenarios(): Promise<Scenario[]>;
    getScenarioById(id: string): Promise<Scenario>;
    updateScenario(id: string, input: UpdateScenarioInput): Promise<Scenario>;
    deleteScenario(id: string): Promise<{
        deleted: boolean;
    }>;
    private validateActions;
    reorderActionsByIds(scenarioId: string, orderedActionIds: string[]): Promise<Scenario>;
    moveActionToIndex(scenarioId: string, actionId: string, toIndex: number): Promise<Scenario>;
    normalizeActionOrders(scenarioId: string): Promise<Scenario>;
}
