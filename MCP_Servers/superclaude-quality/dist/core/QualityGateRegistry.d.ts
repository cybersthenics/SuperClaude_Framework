import { QualityGate, QualityGateType, QualityGateConfig } from '../types/index.js';
export interface QualityGateRegistryConfig {
    enabledGates: QualityGateType[];
    gateConfigurations: Record<QualityGateType, QualityGateConfig>;
    defaultTimeout: number;
    enableCaching: boolean;
}
export declare class QualityGateRegistry {
    private gates;
    private validators;
    private logger;
    private config;
    constructor(config?: Partial<QualityGateRegistryConfig>);
    getAllGates(): Promise<QualityGate[]>;
    getGate(type: QualityGateType): Promise<QualityGate | undefined>;
    getGatesByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): Promise<QualityGate[]>;
    getGatesByNames(names: string[]): Promise<QualityGate[]>;
    setGateEnabled(type: QualityGateType, enabled: boolean): Promise<void>;
    updateGateConfiguration(type: QualityGateType, config: Partial<QualityGateConfig>): Promise<void>;
    getGateStatistics(): Promise<Record<QualityGateType, any>>;
    private mergeWithDefaults;
    private getDefaultGateConfigurations;
    private initializeValidators;
    private registerGates;
    private registerGate;
    private validateDependencies;
    getExecutionOrder(): Promise<QualityGateType[]>;
    getParallelGroups(): Promise<QualityGateType[][]>;
}
//# sourceMappingURL=QualityGateRegistry.d.ts.map