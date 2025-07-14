export class FrameworkIntegrator {
    frameworkRegistry;
    conventionEnforcer;
    dependencyManager;
    constructor(frameworkRegistry, conventionEnforcer, dependencyManager) {
        this.frameworkRegistry = frameworkRegistry;
        this.conventionEnforcer = conventionEnforcer;
        this.dependencyManager = dependencyManager;
    }
    async detectFramework(project) {
        try {
            const indicators = [];
            let detectedFramework = null;
            let confidence = 0;
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
            const frameworkFromConfig = await this.detectFromConfigFiles(project.configFiles);
            if (frameworkFromConfig) {
                detectedFramework = frameworkFromConfig.framework;
                indicators.push(...frameworkFromConfig.indicators);
                confidence += frameworkFromConfig.confidence;
            }
            const frameworkFromFiles = await this.detectFromSourceFiles(project.sourceFiles);
            if (frameworkFromFiles) {
                if (!detectedFramework) {
                    detectedFramework = frameworkFromFiles.framework;
                }
                indicators.push(...frameworkFromFiles.indicators);
                confidence += frameworkFromFiles.confidence;
            }
            const suggestions = await this.generateFrameworkSuggestions(project, detectedFramework, confidence);
            return {
                framework: detectedFramework,
                confidence: Math.min(confidence, 1.0),
                indicators,
                suggestions
            };
        }
        catch (error) {
            return {
                framework: null,
                confidence: 0,
                indicators: [],
                suggestions: [`Framework detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }
    async generateFrameworkCode(framework, specs) {
        try {
            const generator = framework.generators.find(g => g.type === specs.type);
            if (!generator) {
                throw new Error(`No generator found for type ${specs.type} in framework ${framework.name}`);
            }
            const context = {
                framework,
                specs,
                conventions: framework.conventions,
                patterns: framework.patterns
            };
            const generatedCode = await generator.generator(context);
            const conventionResult = await this.enforceConventions(generatedCode, framework);
            const additionalFiles = await this.generateAdditionalFiles(framework, specs);
            const requiredDeps = await this.getRequiredDependencies(framework, specs);
            const instructions = await this.generateInstructions(framework, specs, requiredDeps);
            return {
                generatedCode: conventionResult.enforcedCode,
                additionalFiles,
                dependencies: requiredDeps,
                instructions
            };
        }
        catch (error) {
            throw new Error(`Framework code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async enforceConventions(code, framework) {
        try {
            const enforcedCode = await this.conventionEnforcer.enforceConventions(code, framework.conventions);
            const changes = await this.identifyConventionChanges(code, enforcedCode);
            const validation = await this.conventionEnforcer.validateConventions(enforcedCode, framework.conventions);
            return {
                enforcedCode,
                changes,
                warnings: validation.warnings
            };
        }
        catch (error) {
            throw new Error(`Convention enforcement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async addFrameworkDependencies(framework, target) {
        try {
            const result = {
                added: [],
                updated: [],
                removed: [],
                conflicts: []
            };
            const currentDeps = await this.dependencyManager.getDependencies();
            const requiredDeps = await this.getFrameworkDependencies(framework);
            for (const [depName, version] of Object.entries(requiredDeps)) {
                if (currentDeps[depName]) {
                    if (currentDeps[depName] !== version) {
                        await this.dependencyManager.updateDependency(depName, version);
                        result.updated.push(`${depName}@${version}`);
                    }
                }
                else {
                    await this.dependencyManager.addDependency(depName, version);
                    result.added.push(`${depName}@${version}`);
                }
            }
            const conflicts = await this.checkDependencyConflicts(requiredDeps, currentDeps);
            result.conflicts = conflicts;
            const validation = await this.dependencyManager.validateDependencies(framework);
            if (!validation.isValid) {
                throw new Error(`Dependency validation failed: ${validation.errors.join(', ')}`);
            }
            return result;
        }
        catch (error) {
            throw new Error(`Adding framework dependencies failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async migrateFrameworkVersion(from, to) {
        try {
            const changes = [];
            const warnings = [];
            const migratedFiles = [];
            const breakingChanges = to.breakingChanges || [];
            const migrationSteps = await this.planMigration(from, to, breakingChanges);
            for (const step of migrationSteps) {
                const stepResult = await this.executeMigrationStep(step);
                changes.push(...stepResult.changes);
                warnings.push(...stepResult.warnings);
                migratedFiles.push(...stepResult.files);
            }
            const depResult = await this.updateFrameworkDependencies(from, to);
            changes.push({
                type: 'dependency_update',
                from: from.version,
                to: to.version,
                dependencies: depResult
            });
            const rollbackId = await this.createMigrationRollback(from, to, changes);
            return {
                success: true,
                migratedFiles,
                changes,
                warnings,
                rollbackId
            };
        }
        catch (error) {
            throw new Error(`Framework migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async detectFromConfigFiles(configFiles) {
        const indicators = [];
        let confidence = 0;
        let framework = null;
        const frameworkConfigMap = {
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
    async detectFromSourceFiles(sourceFiles) {
        const indicators = [];
        let confidence = 0;
        let framework = null;
        const patterns = {
            react: { pattern: /import.*from ['"]react['"]/, framework: 'react', confidence: 0.3 },
            vue: { pattern: /<template>|<script>|<style>/, framework: 'vue', confidence: 0.3 },
            angular: { pattern: /@Component|@Injectable|@NgModule/, framework: 'angular', confidence: 0.3 }
        };
        for (const file of sourceFiles.slice(0, 10)) {
            for (const [name, { pattern, framework: fwName, confidence: conf }] of Object.entries(patterns)) {
                if (file.includes(name)) {
                    framework = await this.frameworkRegistry.getFramework(fwName);
                    indicators.push(`Source pattern: ${name} in ${file}`);
                    confidence += conf;
                }
            }
        }
        return framework ? { framework, indicators, confidence } : null;
    }
    async generateFrameworkSuggestions(project, detectedFramework, confidence) {
        const suggestions = [];
        if (!detectedFramework) {
            suggestions.push('No framework detected. Consider using a modern framework like React, Vue, or Angular.');
        }
        else if (confidence < 0.5) {
            suggestions.push(`Framework detection uncertain (${Math.round(confidence * 100)}%). Please verify.`);
        }
        if (detectedFramework && !project.packageJson) {
            suggestions.push('Consider adding a package.json file for better dependency management.');
        }
        return suggestions;
    }
    async generateAdditionalFiles(framework, specs) {
        const files = {};
        if (framework.name === 'react' && specs.type === 'component') {
            files[`${specs.name}.test.tsx`] = this.generateReactTestFile(specs.name);
        }
        return files;
    }
    generateReactTestFile(componentName) {
        return `import React from 'react';
import { render, screen } from '@testing-library/react';
import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
  });
});`;
    }
    async getRequiredDependencies(framework, specs) {
        const deps = [];
        deps.push(framework.name);
        if (specs.type === 'component' && framework.name === 'react') {
            deps.push('@types/react', '@types/react-dom');
        }
        return deps;
    }
    async generateInstructions(framework, specs, dependencies) {
        const instructions = [];
        instructions.push(`Generated ${specs.type} for ${framework.name} framework`);
        if (dependencies.length > 0) {
            instructions.push(`Install dependencies: ${dependencies.join(', ')}`);
        }
        instructions.push('Review generated code and customize as needed');
        return instructions;
    }
    async identifyConventionChanges(original, enforced) {
        const changes = [];
        if (original !== enforced) {
            changes.push('Code formatting applied');
        }
        return changes;
    }
    async getFrameworkDependencies(framework) {
        const deps = {};
        deps[framework.name] = framework.version;
        if (framework.name === 'react') {
            deps['react-dom'] = framework.version;
        }
        return deps;
    }
    async checkDependencyConflicts(required, current) {
        const conflicts = [];
        for (const [depName, requiredVersion] of Object.entries(required)) {
            if (current[depName] && current[depName] !== requiredVersion) {
                conflicts.push(`${depName}: current ${current[depName]} vs required ${requiredVersion}`);
            }
        }
        return conflicts;
    }
    async planMigration(from, to, breakingChanges) {
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
    canAutomate(change) {
        return !change.toLowerCase().includes('manual') && !change.toLowerCase().includes('review');
    }
    async executeMigrationStep(step) {
        return {
            changes: [{ type: step.type, description: step.description }],
            warnings: step.automated ? [] : [`Manual step required: ${step.description}`],
            files: []
        };
    }
    async updateFrameworkDependencies(from, to) {
        await this.dependencyManager.updateDependency(from.name, to.version);
        return { updated: [`${from.name}@${to.version}`] };
    }
    async createMigrationRollback(from, to, changes) {
        const rollbackId = `migration_${from.version}_to_${to.version}_${Date.now()}`;
        return rollbackId;
    }
    async loadFrameworkConventions(framework) {
        return framework.conventions;
    }
    async validateFrameworkCompatibility(code, framework) {
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
        }
        catch (error) {
            return {
                isCompatible: false,
                issues: [`Compatibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
                recommendations: [],
                compatibilityScore: 0
            };
        }
    }
    async optimizeForFramework(code, framework) {
        try {
            let optimizedCode = code;
            const conventionResult = await this.enforceConventions(code, framework);
            optimizedCode = conventionResult.enforcedCode;
            for (const pattern of framework.patterns) {
                optimizedCode = await this.applyPatternOptimization(optimizedCode, pattern);
            }
            return optimizedCode;
        }
        catch (error) {
            console.warn(`Framework optimization failed: ${error}`);
            return code;
        }
    }
    async applyPatternOptimization(code, pattern) {
        return code;
    }
}
//# sourceMappingURL=FrameworkIntegrator.js.map