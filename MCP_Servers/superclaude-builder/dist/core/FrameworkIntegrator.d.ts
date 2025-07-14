import { Framework, FrameworkConventions, ValidationResult } from '../types/index.js';
export interface FrameworkRegistry {
    getFramework(name: string, version?: string): Promise<Framework | null>;
    registerFramework(framework: Framework): Promise<void>;
    listFrameworks(): Promise<Framework[]>;
    detectFrameworkFromFiles(files: string[]): Promise<Framework | null>;
}
export interface ConventionEnforcer {
    enforceConventions(code: string, conventions: FrameworkConventions): Promise<string>;
    validateConventions(code: string, conventions: FrameworkConventions): Promise<ValidationResult>;
    suggestConventionFixes(code: string, conventions: FrameworkConventions): Promise<string[]>;
}
export interface DependencyManager {
    addDependency(packageName: string, version: string, isDev?: boolean): Promise<void>;
    removeDependency(packageName: string): Promise<void>;
    updateDependency(packageName: string, version: string): Promise<void>;
    getDependencies(): Promise<{
        [key: string]: string;
    }>;
    validateDependencies(framework: Framework): Promise<ValidationResult>;
}
export interface ProjectContext {
    rootPath: string;
    packageJson?: any;
    configFiles: string[];
    sourceFiles: string[];
    dependencies: {
        [key: string]: string;
    };
}
export interface FrameworkDetection {
    framework: Framework | null;
    confidence: number;
    indicators: string[];
    suggestions: string[];
}
export interface FrameworkSpecs {
    type: 'component' | 'service' | 'module' | 'configuration' | 'test';
    name: string;
    specifications: any;
    options?: any;
}
export interface FrameworkResult {
    generatedCode: string;
    additionalFiles: {
        [filename: string]: string;
    };
    dependencies: string[];
    instructions: string[];
}
export interface FrameworkVersion {
    name: string;
    version: string;
    features: string[];
    breakingChanges?: string[];
}
export interface MigrationResult {
    success: boolean;
    migratedFiles: string[];
    changes: any[];
    warnings: string[];
    rollbackId: string;
}
export interface CompatibilityResult {
    isCompatible: boolean;
    issues: string[];
    recommendations: string[];
    compatibilityScore: number;
}
export interface DependencyResult {
    added: string[];
    updated: string[];
    removed: string[];
    conflicts: string[];
}
export interface ConventionResult {
    enforcedCode: string;
    changes: string[];
    warnings: string[];
}
export declare class FrameworkIntegrator {
    private frameworkRegistry;
    private conventionEnforcer;
    private dependencyManager;
    constructor(frameworkRegistry: FrameworkRegistry, conventionEnforcer: ConventionEnforcer, dependencyManager: DependencyManager);
    detectFramework(project: ProjectContext): Promise<FrameworkDetection>;
    generateFrameworkCode(framework: Framework, specs: FrameworkSpecs): Promise<FrameworkResult>;
    enforceConventions(code: string, framework: Framework): Promise<ConventionResult>;
    addFrameworkDependencies(framework: Framework, target: ProjectContext): Promise<DependencyResult>;
    migrateFrameworkVersion(from: FrameworkVersion, to: FrameworkVersion): Promise<MigrationResult>;
    private detectFromConfigFiles;
    private detectFromSourceFiles;
    private generateFrameworkSuggestions;
    private generateAdditionalFiles;
    private generateReactTestFile;
    private getRequiredDependencies;
    private generateInstructions;
    private identifyConventionChanges;
    private getFrameworkDependencies;
    private checkDependencyConflicts;
    private planMigration;
    private canAutomate;
    private executeMigrationStep;
    private updateFrameworkDependencies;
    private createMigrationRollback;
    loadFrameworkConventions(framework: Framework): Promise<FrameworkConventions>;
    validateFrameworkCompatibility(code: string, framework: Framework): Promise<CompatibilityResult>;
    optimizeForFramework(code: string, framework: Framework): Promise<string>;
    private applyPatternOptimization;
}
//# sourceMappingURL=FrameworkIntegrator.d.ts.map