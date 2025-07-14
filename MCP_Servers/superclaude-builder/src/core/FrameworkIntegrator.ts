import {
  Framework,
  FrameworkConventions,
  ProjectType,
  ValidationResult
} from '../types/index.js';

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
  getDependencies(): Promise<{ [key: string]: string }>;
  validateDependencies(framework: Framework): Promise<ValidationResult>;
}

export interface ProjectContext {
  rootPath: string;
  packageJson?: any;
  configFiles: string[];
  sourceFiles: string[];
  dependencies: { [key: string]: string };
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
  additionalFiles: { [filename: string]: string };
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

export class FrameworkIntegrator {
  constructor(
    private frameworkRegistry: FrameworkRegistry,
    private conventionEnforcer: ConventionEnforcer,
    private dependencyManager: DependencyManager
  ) {}

  async detectFramework(project: ProjectContext): Promise<FrameworkDetection> {
    try {
      const indicators: string[] = [];
      let detectedFramework: Framework | null = null;
      let confidence = 0;

      // Check package.json dependencies
      if (project.packageJson?.dependencies || project.packageJson?.devDependencies) {
        const allDeps = {
          ...project.packageJson.dependencies,
          ...project.packageJson.devDependencies
        };

        for (const [depName, version] of Object.entries(allDeps)) {
          const framework = await this.frameworkRegistry.getFramework(depName);
          if (framework) {
            detectedFramework = framework;
            indicators.push(`Dependency: ${depName}@${version}`);
            confidence += 0.3;
          }
        }
      }

      // Check configuration files
      const frameworkFromConfig = await this.detectFromConfigFiles(project.configFiles);
      if (frameworkFromConfig) {
        detectedFramework = frameworkFromConfig.framework;
        indicators.push(...frameworkFromConfig.indicators);
        confidence += frameworkFromConfig.confidence;
      }

      // Check source file patterns
      const frameworkFromFiles = await this.detectFromSourceFiles(project.sourceFiles);
      if (frameworkFromFiles) {
        if (!detectedFramework) {
          detectedFramework = frameworkFromFiles.framework;
        }
        indicators.push(...frameworkFromFiles.indicators);
        confidence += frameworkFromFiles.confidence;
      }

      // Generate suggestions
      const suggestions = await this.generateFrameworkSuggestions(
        project,
        detectedFramework,
        confidence
      );

      return {
        framework: detectedFramework,
        confidence: Math.min(confidence, 1.0),
        indicators,
        suggestions
      };
    } catch (error) {
      return {
        framework: null,
        confidence: 0,
        indicators: [],
        suggestions: [`Framework detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  async generateFrameworkCode(
    framework: Framework,
    specs: FrameworkSpecs
  ): Promise<FrameworkResult> {
    try {
      // Find appropriate generator for the specs type
      const generator = framework.generators.find(g => g.type === specs.type);
      if (!generator) {
        throw new Error(`No generator found for type ${specs.type} in framework ${framework.name}`);
      }

      // Prepare generation context
      const context = {
        framework,
        specs,
        conventions: framework.conventions,
        patterns: framework.patterns
      };

      // Generate code using the framework generator
      const generatedCode = await generator.generator(context);

      // Enforce framework conventions
      const conventionResult = await this.enforceConventions(generatedCode, framework);

      // Determine additional files needed
      const additionalFiles = await this.generateAdditionalFiles(framework, specs);

      // Determine required dependencies
      const requiredDeps = await this.getRequiredDependencies(framework, specs);

      // Generate instructions
      const instructions = await this.generateInstructions(framework, specs, requiredDeps);

      return {
        generatedCode: conventionResult.enforcedCode,
        additionalFiles,
        dependencies: requiredDeps,
        instructions
      };
    } catch (error) {
      throw new Error(`Framework code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async enforceConventions(code: string, framework: Framework): Promise<ConventionResult> {
    try {
      const enforcedCode = await this.conventionEnforcer.enforceConventions(
        code,
        framework.conventions
      );

      // Identify what changed
      const changes = await this.identifyConventionChanges(code, enforcedCode);

      // Validate the enforced code
      const validation = await this.conventionEnforcer.validateConventions(
        enforcedCode,
        framework.conventions
      );

      return {
        enforcedCode,
        changes,
        warnings: validation.warnings
      };
    } catch (error) {
      throw new Error(`Convention enforcement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addFrameworkDependencies(
    framework: Framework,
    target: ProjectContext
  ): Promise<DependencyResult> {
    try {
      const result: DependencyResult = {
        added: [],
        updated: [],
        removed: [],
        conflicts: []
      };

      // Get current dependencies
      const currentDeps = await this.dependencyManager.getDependencies();

      // Determine required dependencies for the framework
      const requiredDeps = await this.getFrameworkDependencies(framework);

      // Add/update dependencies
      for (const [depName, version] of Object.entries(requiredDeps)) {
        if (currentDeps[depName]) {
          if (currentDeps[depName] !== version) {
            await this.dependencyManager.updateDependency(depName, version);
            result.updated.push(`${depName}@${version}`);
          }
        } else {
          await this.dependencyManager.addDependency(depName, version);
          result.added.push(`${depName}@${version}`);
        }
      }

      // Check for conflicts
      const conflicts = await this.checkDependencyConflicts(requiredDeps, currentDeps);
      result.conflicts = conflicts;

      // Validate final dependency state
      const validation = await this.dependencyManager.validateDependencies(framework);
      if (!validation.isValid) {
        throw new Error(`Dependency validation failed: ${validation.errors.join(', ')}`);
      }

      return result;
    } catch (error) {
      throw new Error(`Adding framework dependencies failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async migrateFrameworkVersion(
    from: FrameworkVersion,
    to: FrameworkVersion
  ): Promise<MigrationResult> {
    try {
      const changes: any[] = [];
      const warnings: string[] = [];
      const migratedFiles: string[] = [];

      // Analyze breaking changes
      const breakingChanges = to.breakingChanges || [];
      
      // Plan migration steps
      const migrationSteps = await this.planMigration(from, to, breakingChanges);

      // Execute migration steps
      for (const step of migrationSteps) {
        const stepResult = await this.executeMigrationStep(step);
        changes.push(...stepResult.changes);
        warnings.push(...stepResult.warnings);
        migratedFiles.push(...stepResult.files);
      }

      // Update dependencies
      const depResult = await this.updateFrameworkDependencies(from, to);
      changes.push({
        type: 'dependency_update',
        from: from.version,
        to: to.version,
        dependencies: depResult
      });

      // Create rollback information
      const rollbackId = await this.createMigrationRollback(from, to, changes);

      return {
        success: true,
        migratedFiles,
        changes,
        warnings,
        rollbackId
      };
    } catch (error) {
      throw new Error(`Framework migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods
  private async detectFromConfigFiles(configFiles: string[]): Promise<{
    framework: Framework | null;
    indicators: string[];
    confidence: number;
  } | null> {
    const indicators: string[] = [];
    let confidence = 0;
    let framework: Framework | null = null;

    const frameworkConfigMap: { [key: string]: string } = {
      'angular.json': 'angular',
      'vue.config.js': 'vue',
      'nuxt.config.js': 'nuxt',
      'next.config.js': 'next',
      'gatsby-config.js': 'gatsby',
      'svelte.config.js': 'svelte',
      'vite.config.js': 'vite',
      'webpack.config.js': 'webpack'
    };

    for (const configFile of configFiles) {
      const fileName = configFile.split('/').pop() || '';
      if (frameworkConfigMap[fileName]) {
        framework = await this.frameworkRegistry.getFramework(frameworkConfigMap[fileName]);
        indicators.push(`Config file: ${fileName}`);
        confidence += 0.4;
      }
    }

    return framework ? { framework, indicators, confidence } : null;
  }

  private async detectFromSourceFiles(sourceFiles: string[]): Promise<{
    framework: Framework | null;
    indicators: string[];
    confidence: number;
  } | null> {
    const indicators: string[] = [];
    let confidence = 0;
    let framework: Framework | null = null;

    // Pattern-based detection
    const patterns: { [key: string]: { pattern: RegExp; framework: string; confidence: number } } = {
      react: { pattern: /import.*from ['"]react['"]/, framework: 'react', confidence: 0.3 },
      vue: { pattern: /<template>|<script>|<style>/, framework: 'vue', confidence: 0.3 },
      angular: { pattern: /@Component|@Injectable|@NgModule/, framework: 'angular', confidence: 0.3 }
    };

    // Check file contents (simplified - would need actual file reading)
    for (const file of sourceFiles.slice(0, 10)) { // Limit for performance
      for (const [name, { pattern, framework: fwName, confidence: conf }] of Object.entries(patterns)) {
        // This would read file content in real implementation
        if (file.includes(name)) {
          framework = await this.frameworkRegistry.getFramework(fwName);
          indicators.push(`Source pattern: ${name} in ${file}`);
          confidence += conf;
        }
      }
    }

    return framework ? { framework, indicators, confidence } : null;
  }

  private async generateFrameworkSuggestions(
    project: ProjectContext,
    detectedFramework: Framework | null,
    confidence: number
  ): Promise<string[]> {
    const suggestions: string[] = [];

    if (!detectedFramework) {
      suggestions.push('No framework detected. Consider using a modern framework like React, Vue, or Angular.');
    } else if (confidence < 0.5) {
      suggestions.push(`Framework detection uncertain (${Math.round(confidence * 100)}%). Please verify.`);
    }

    if (detectedFramework && !project.packageJson) {
      suggestions.push('Consider adding a package.json file for better dependency management.');
    }

    return suggestions;
  }

  private async generateAdditionalFiles(
    framework: Framework,
    specs: FrameworkSpecs
  ): Promise<{ [filename: string]: string }> {
    const files: { [filename: string]: string } = {};

    // Generate framework-specific configuration files
    if (framework.name === 'react' && specs.type === 'component') {
      files[`${specs.name}.test.tsx`] = this.generateReactTestFile(specs.name);
    }

    return files;
  }

  private generateReactTestFile(componentName: string): string {
    return `import React from 'react';
import { render, screen } from '@testing-library/react';
import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
  });
});`;
  }

  private async getRequiredDependencies(
    framework: Framework,
    specs: FrameworkSpecs
  ): Promise<string[]> {
    const deps: string[] = [];

    // Add framework core dependencies
    deps.push(framework.name);

    // Add type-specific dependencies
    if (specs.type === 'component' && framework.name === 'react') {
      deps.push('@types/react', '@types/react-dom');
    }

    return deps;
  }

  private async generateInstructions(
    framework: Framework,
    specs: FrameworkSpecs,
    dependencies: string[]
  ): Promise<string[]> {
    const instructions: string[] = [];

    instructions.push(`Generated ${specs.type} for ${framework.name} framework`);
    
    if (dependencies.length > 0) {
      instructions.push(`Install dependencies: ${dependencies.join(', ')}`);
    }

    instructions.push('Review generated code and customize as needed');

    return instructions;
  }

  private async identifyConventionChanges(original: string, enforced: string): Promise<string[]> {
    const changes: string[] = [];

    if (original !== enforced) {
      changes.push('Code formatting applied');
      // More detailed change detection would go here
    }

    return changes;
  }

  private async getFrameworkDependencies(framework: Framework): Promise<{ [key: string]: string }> {
    const deps: { [key: string]: string } = {};

    deps[framework.name] = framework.version;

    // Add common framework dependencies
    if (framework.name === 'react') {
      deps['react-dom'] = framework.version;
    }

    return deps;
  }

  private async checkDependencyConflicts(
    required: { [key: string]: string },
    current: { [key: string]: string }
  ): Promise<string[]> {
    const conflicts: string[] = [];

    for (const [depName, requiredVersion] of Object.entries(required)) {
      if (current[depName] && current[depName] !== requiredVersion) {
        conflicts.push(`${depName}: current ${current[depName]} vs required ${requiredVersion}`);
      }
    }

    return conflicts;
  }

  private async planMigration(
    from: FrameworkVersion,
    to: FrameworkVersion,
    breakingChanges: string[]
  ): Promise<any[]> {
    const steps = [];

    steps.push({
      type: 'dependency_update',
      description: `Update ${from.name} from ${from.version} to ${to.version}`
    });

    for (const change of breakingChanges) {
      steps.push({
        type: 'breaking_change',
        description: change,
        automated: this.canAutomate(change)
      });
    }

    return steps;
  }

  private canAutomate(change: string): boolean {
    // Simple heuristic for automation capability
    return !change.toLowerCase().includes('manual') && !change.toLowerCase().includes('review');
  }

  private async executeMigrationStep(step: any): Promise<{
    changes: any[];
    warnings: string[];
    files: string[];
  }> {
    return {
      changes: [{ type: step.type, description: step.description }],
      warnings: step.automated ? [] : [`Manual step required: ${step.description}`],
      files: []
    };
  }

  private async updateFrameworkDependencies(
    from: FrameworkVersion,
    to: FrameworkVersion
  ): Promise<any> {
    await this.dependencyManager.updateDependency(from.name, to.version);
    return { updated: [`${from.name}@${to.version}`] };
  }

  private async createMigrationRollback(
    from: FrameworkVersion,
    to: FrameworkVersion,
    changes: any[]
  ): Promise<string> {
    // Create rollback data
    const rollbackId = `migration_${from.version}_to_${to.version}_${Date.now()}`;
    // Store rollback information
    return rollbackId;
  }

  // Public utility methods
  async loadFrameworkConventions(framework: Framework): Promise<FrameworkConventions> {
    return framework.conventions;
  }

  async validateFrameworkCompatibility(
    code: string,
    framework: Framework
  ): Promise<CompatibilityResult> {
    try {
      const validator = framework.validators.find(v => v.name === 'compatibility');
      if (!validator) {
        return {
          isCompatible: true,
          issues: [],
          recommendations: [],
          compatibilityScore: 1.0
        };
      }

      const validation = validator.validate(code);
      
      return {
        isCompatible: validation.isValid,
        issues: validation.errors,
        recommendations: validation.suggestions,
        compatibilityScore: validation.isValid ? 1.0 : 0.5
      };
    } catch (error) {
      return {
        isCompatible: false,
        issues: [`Compatibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: [],
        compatibilityScore: 0
      };
    }
  }

  async optimizeForFramework(code: string, framework: Framework): Promise<string> {
    try {
      // Apply framework-specific optimizations
      let optimizedCode = code;

      // Apply convention enforcement
      const conventionResult = await this.enforceConventions(code, framework);
      optimizedCode = conventionResult.enforcedCode;

      // Apply framework-specific patterns
      for (const pattern of framework.patterns) {
        optimizedCode = await this.applyPatternOptimization(optimizedCode, pattern);
      }

      return optimizedCode;
    } catch (error) {
      console.warn(`Framework optimization failed: ${error}`);
      return code;
    }
  }

  private async applyPatternOptimization(code: string, pattern: any): Promise<string> {
    // Apply pattern-based optimizations
    return code;
  }
}