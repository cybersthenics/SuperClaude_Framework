import { ValidationResult } from '../types/index.js';
export interface BuildConfiguration {
    target: 'development' | 'production' | 'test';
    entryPoints: string[];
    outputDir: string;
    optimization: {
        minify?: boolean;
        treeshake?: boolean;
        sourceMaps?: boolean;
        bundleSplitting?: boolean;
    };
    plugins: string[];
    environment: {
        [key: string]: string;
    };
    framework?: string;
}
export interface BuildResult {
    success: boolean;
    artifacts: string[];
    metrics: BuildMetrics;
    warnings: string[];
    errors: string[];
    duration: number;
}
export interface BuildMetrics {
    bundleSize: number;
    assetCount: number;
    chunkCount: number;
    optimizationSavings: number;
    buildTime: number;
}
export interface CodeStructure {
    entryPoints: string[];
    modules: ModuleInfo[];
    dependencies: DependencyGraph;
    assets: AssetInfo[];
}
export interface ModuleInfo {
    path: string;
    size: number;
    exports: string[];
    imports: string[];
    type: 'js' | 'ts' | 'css' | 'asset';
}
export interface DependencyGraph {
    nodes: string[];
    edges: {
        from: string;
        to: string;
        type: string;
    }[];
    cycles: string[][];
}
export interface AssetInfo {
    path: string;
    size: number;
    type: string;
    optimized: boolean;
}
export interface OptimizationResult {
    originalSize: number;
    optimizedSize: number;
    savings: number;
    techniques: string[];
    warnings: string[];
}
export interface BundleConfiguration {
    format: 'esm' | 'cjs' | 'umd' | 'iife';
    target: string[];
    splitting: boolean;
    external: string[];
    globals: {
        [key: string]: string;
    };
}
export interface BundleResult {
    bundles: BundleInfo[];
    totalSize: number;
    gzippedSize: number;
    chunks: ChunkInfo[];
}
export interface BundleInfo {
    name: string;
    path: string;
    size: number;
    gzippedSize: number;
    modules: string[];
}
export interface ChunkInfo {
    name: string;
    size: number;
    modules: string[];
    isEntry: boolean;
}
export interface Codebase {
    rootPath: string;
    sourceFiles: string[];
    configFiles: string[];
    packageJson: any;
    dependencies: {
        [key: string]: string;
    };
}
export interface DocumentationResult {
    apiDocs: string;
    readme: string;
    changeLog: string;
    typeDefinitions: string;
    coverage: number;
}
export interface CleanupScope {
    directories: string[];
    filePatterns: string[];
    preservePatterns: string[];
    dryRun: boolean;
}
export interface CleanupResult {
    deletedFiles: string[];
    deletedDirectories: string[];
    freedSpace: number;
    warnings: string[];
}
export interface BuildPipeline {
    stages: BuildStage[];
    parallel: boolean;
    failFast: boolean;
}
export interface BuildStage {
    name: string;
    command: string;
    dependencies: string[];
    timeout: number;
}
export interface DependencyResolver {
    resolveDependencies(entryPoints: string[]): Promise<DependencyGraph>;
    optimizeDependencies(graph: DependencyGraph): Promise<DependencyGraph>;
    validateDependencies(graph: DependencyGraph): Promise<ValidationResult>;
}
export interface OptimizationEngine {
    optimizeCode(code: string, target: string): Promise<string>;
    optimizeAssets(assets: AssetInfo[]): Promise<AssetInfo[]>;
    analyzeBundleSize(bundles: BundleInfo[]): Promise<any>;
}
export interface QualityGate {
    validateBuild(result: BuildResult): Promise<ValidationResult>;
    checkPerformance(metrics: BuildMetrics): Promise<ValidationResult>;
    validateArtifacts(artifacts: string[]): Promise<ValidationResult>;
}
export interface BuildAnalysis {
    requirements: BuildRequirements;
    recommendations: string[];
    estimatedTime: number;
    complexity: 'low' | 'medium' | 'high';
}
export interface BuildRequirements {
    toolchain: string[];
    dependencies: string[];
    environment: {
        [key: string]: string;
    };
    resources: {
        memory: number;
        disk: number;
        cpu: number;
    };
}
export interface DependencyResolution {
    resolved: {
        [key: string]: string;
    };
    conflicts: string[];
    missing: string[];
    circular: string[][];
}
export declare class BuildOrchestrator {
    private buildPipeline;
    private dependencyResolver;
    private optimizationEngine;
    private qualityGate;
    constructor(buildPipeline: BuildPipeline, dependencyResolver: DependencyResolver, optimizationEngine: OptimizationEngine, qualityGate: QualityGate);
    executeBuild(buildConfig: BuildConfiguration): Promise<BuildResult>;
    optimizeCodeStructure(target: CodeStructure): Promise<OptimizationResult>;
    bundleApplication(config: BundleConfiguration): Promise<BundleResult>;
    generateDocumentation(codebase: Codebase): Promise<DocumentationResult>;
    performCleanup(scope: CleanupScope): Promise<CleanupResult>;
    private analyzeBuildRequirements;
    private validateBuildConfiguration;
    private resolveBuildDependencies;
    private executeBuildPipeline;
    private executeOptimizationPipeline;
    private validateBuildOutput;
    private calculateTotalSize;
    private optimizeModules;
    private calculateOptimizedSize;
    private createBundleStrategy;
    private executeBundling;
    private generateChunkInfo;
    private generateAPIDocumentation;
    private generateReadme;
    private generateChangelog;
    private generateTypeDefinitions;
    private calculateDocumentationCoverage;
    private findFilesMatchingPattern;
    private shouldPreserveFile;
    private getFileSize;
    private deleteFile;
    private isDirectoryEmpty;
    private deleteDirectory;
    private fileExists;
    private isDirectoryWritable;
    private checkPluginConflicts;
    private executeStage;
    private readFile;
    private calculateSavings;
}
//# sourceMappingURL=BuildOrchestrator.d.ts.map