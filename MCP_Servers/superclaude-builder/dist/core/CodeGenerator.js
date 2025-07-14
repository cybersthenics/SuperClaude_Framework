export class CodeGenerator {
    frameworkDetector;
    templateEngine;
    contextAnalyzer;
    semanticValidator;
    constructor(frameworkDetector, templateEngine, contextAnalyzer, semanticValidator) {
        this.frameworkDetector = frameworkDetector;
        this.templateEngine = templateEngine;
        this.contextAnalyzer = contextAnalyzer;
        this.semanticValidator = semanticValidator;
    }
    async generateCode(context, template) {
        try {
            const contextAnalysis = await this.analyzeGenerationContext(context);
            const selectedTemplate = template || await this.selectOptimalTemplate(contextAnalysis, context.requirements);
            const templateVariables = await this.prepareTemplateVariables(context, contextAnalysis);
            const generatedCode = await this.templateEngine.renderTemplate(selectedTemplate, templateVariables);
            const validation = await this.validateGeneratedCode(generatedCode, context);
            if (!validation.isValid) {
                throw new Error(`Generated code validation failed: ${validation.errors.join(', ')}`);
            }
            const optimizedCode = await this.optimizeGeneratedCode(generatedCode, context);
            const imports = await this.extractImports(optimizedCode, context);
            const exports = await this.extractExports(optimizedCode, context);
            return {
                generatedCode: optimizedCode,
                imports,
                exports,
                metadata: {
                    template: selectedTemplate.name,
                    language: context.language,
                    framework: context.framework?.name,
                    linesGenerated: optimizedCode.split('\n').length,
                    timestamp: Date.now()
                }
            };
        }
        catch (error) {
            throw new Error(`Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async generateUIComponent(specs, framework) {
        try {
            const context = {
                projectType: { language: 'typescript', framework: framework.name },
                framework,
                language: 'typescript',
                targetLocation: { uri: '', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
                existingCode: { imports: [], exports: [], symbols: [], dependencies: [] },
                requirements: {
                    type: 'component',
                    name: specs.name,
                    description: `React component: ${specs.name}`
                },
                constraints: {
                    maxLines: 500,
                    conventions: framework.conventions,
                    dependencies: [],
                    performance: {}
                }
            };
            const componentTemplate = await this.templateEngine.loadTemplate('component', 'typescript', framework.name);
            const componentVariables = {
                componentName: specs.name,
                props: specs.props || [],
                state: specs.state || [],
                events: specs.events || [],
                styling: specs.styling,
                accessibility: specs.accessibility,
                behavior: specs.behavior
            };
            const componentCode = await this.templateEngine.renderTemplate(componentTemplate, componentVariables);
            const propsInterface = specs.props?.length > 0
                ? await this.generatePropsInterface(specs.props, specs.name)
                : undefined;
            const styles = specs.includeStyles && specs.styling
                ? await this.generateComponentStyles(specs.styling, specs.name)
                : undefined;
            const tests = specs.includeTests
                ? await this.generateComponentTests(specs, framework)
                : undefined;
            const validation = await this.validateComponentCode(componentCode, framework);
            if (!validation.isValid) {
                throw new Error(`Component validation failed: ${validation.errors.join(', ')}`);
            }
            return {
                componentCode,
                propsInterface,
                styles,
                tests,
                imports: await this.extractComponentImports(componentCode, framework),
                exports: [specs.name]
            };
        }
        catch (error) {
            throw new Error(`UI component generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async implementInterface(interfaceDef, options = {}) {
        try {
            const methods = [];
            for (const method of interfaceDef.methods) {
                const methodImpl = await this.generateMethodImplementation(method, options);
                methods.push(methodImpl);
            }
            const properties = [];
            for (const property of interfaceDef.properties) {
                const propImpl = await this.generatePropertyImplementation(property, options);
                properties.push(propImpl);
            }
            const implementation = await this.generateClassImplementation(interfaceDef.name, methods, properties, interfaceDef.extends, options);
            return {
                implementation,
                methods,
                properties
            };
        }
        catch (error) {
            throw new Error(`Interface implementation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async overrideMethod(method, parentClass) {
        try {
            const parentMethod = parentClass.methods.find(m => m.name === method.name);
            if (!parentMethod) {
                throw new Error(`Method ${method.name} not found in parent class ${parentClass.name}`);
            }
            const overrideCode = await this.generateMethodOverride(method, parentMethod, parentClass);
            const callsSuper = overrideCode.includes('super.');
            return {
                overriddenMethod: overrideCode,
                callsSuper,
                preservedBehavior: true
            };
        }
        catch (error) {
            throw new Error(`Method override failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async generateStubs(usage, options = {}) {
        try {
            const stubs = [];
            const implementations = [];
            for (const pattern of usage) {
                const stub = await this.generateStubForPattern(pattern, options);
                stubs.push(stub);
                if (options.throwNotImplemented !== false) {
                    const impl = await this.generateNotImplementedBody(pattern);
                    implementations.push(impl);
                }
            }
            return {
                stubs,
                implementations
            };
        }
        catch (error) {
            throw new Error(`Stub generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async generateTests(target, framework) {
        try {
            const testTemplate = await framework.generateTestTemplate(target);
            const testCode = await this.generateTestCodeForTarget(target, testTemplate, framework);
            const imports = await this.generateTestImports(target, framework);
            const setup = await this.generateTestSetup(target, framework);
            const teardown = await this.generateTestTeardown(target, framework);
            return {
                testCode,
                imports,
                setup,
                teardown
            };
        }
        catch (error) {
            throw new Error(`Test generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async generateAPIEndpoints(specification) {
        try {
            const routeHandlers = [];
            for (const endpoint of specification.endpoints) {
                const handler = await this.generateRouteHandler(endpoint);
                routeHandlers.push(handler);
            }
            const middleware = [];
            if (specification.middleware) {
                for (const mw of specification.middleware) {
                    const middlewareCode = await this.generateMiddleware(mw);
                    middleware.push(middlewareCode);
                }
            }
            const schemas = [];
            if (specification.schemas) {
                for (const schema of specification.schemas) {
                    const schemaCode = await this.generateValidationSchema(schema);
                    schemas.push(schemaCode);
                }
            }
            const errorHandlers = [];
            if (specification.errorHandling) {
                const errorHandler = await this.generateErrorHandler(specification.errorHandling);
                errorHandlers.push(errorHandler);
            }
            const routerConfig = await this.generateRouterConfig(routeHandlers, middleware);
            const typeDefinitions = await this.generateAPITypeDefinitions(specification);
            const documentation = await this.generateAPIDocumentation(specification);
            return {
                routeHandlers,
                middleware,
                schemas,
                errorHandlers,
                routerConfig,
                typeDefinitions,
                documentation
            };
        }
        catch (error) {
            throw new Error(`API endpoint generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async analyzeGenerationContext(context) {
        return await this.contextAnalyzer.analyzeContext(context);
    }
    async selectOptimalTemplate(contextAnalysis, requirements) {
        const templates = await this.templateEngine.getAvailableTemplates(contextAnalysis.language, contextAnalysis.framework?.name);
        const templateName = this.selectTemplateByType(requirements.type);
        return await this.templateEngine.loadTemplate(templateName, contextAnalysis.language, contextAnalysis.framework?.name);
    }
    selectTemplateByType(type) {
        const templateMap = {
            'function': 'function',
            'class': 'class',
            'interface': 'interface',
            'component': 'component',
            'module': 'module',
            'api': 'api-endpoint',
            'test': 'test'
        };
        return templateMap[type] || 'basic';
    }
    async prepareTemplateVariables(context, contextAnalysis) {
        return {
            name: context.requirements.name,
            description: context.requirements.description,
            parameters: context.requirements.parameters || [],
            returnType: context.requirements.returnType || 'void',
            language: context.language,
            framework: context.framework?.name,
            conventions: context.framework?.conventions,
            timestamp: new Date().toISOString(),
            author: 'SuperClaude Builder'
        };
    }
    async validateGeneratedCode(code, context) {
        return await this.semanticValidator.validateGeneratedCode(code, context);
    }
    async optimizeGeneratedCode(code, context) {
        return code
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();
    }
    async extractImports(code, context) {
        const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
        const imports = [];
        let match;
        while ((match = importRegex.exec(code)) !== null) {
            imports.push({
                type: 'add',
                module: match[1],
                symbols: [],
                alias: undefined
            });
        }
        return imports;
    }
    async extractExports(code, context) {
        const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
        const exports = [];
        let match;
        while ((match = exportRegex.exec(code)) !== null) {
            exports.push({
                type: 'add',
                symbol: match[1],
                exportType: code.includes('export default') ? 'default' : 'named'
            });
        }
        return exports;
    }
    async generatePropsInterface(props, componentName) {
        const propTypes = props.map(prop => `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`).join('\n');
        return `interface ${componentName}Props {\n${propTypes}\n}`;
    }
    async generateComponentStyles(styling, componentName) {
        return `.${componentName.toLowerCase()} {\n  /* Generated styles */\n}`;
    }
    async generateComponentTests(specs, framework) {
        return `// Generated tests for ${specs.name}\ndescribe('${specs.name}', () => {\n  it('should render', () => {\n    // Test implementation\n  });\n});`;
    }
    async validateComponentCode(code, framework) {
        const hasExport = code.includes('export');
        const hasComponent = code.includes('function') || code.includes('class');
        return {
            isValid: hasExport && hasComponent,
            errors: [],
            warnings: [],
            suggestions: []
        };
    }
    async extractComponentImports(code, framework) {
        const imports = [];
        if (framework.name === 'react') {
            imports.push('React');
        }
        return imports;
    }
    async generateMethodImplementation(method, options) {
        const params = method.parameters?.map((p) => `${p.name}: ${p.type}`).join(', ') || '';
        const returnType = method.returnType || 'void';
        let body = '';
        if (options.generateStubs) {
            body = returnType === 'void' ? '' : `  return null as any; // TODO: Implement`;
        }
        else {
            body = '  throw new Error("Not implemented");';
        }
        return `${method.accessibility || 'public'} ${method.name}(${params}): ${returnType} {\n${body}\n}`;
    }
    async generatePropertyImplementation(property, options) {
        return `${property.accessibility || 'public'} ${property.name}: ${property.type};`;
    }
    async generateClassImplementation(name, methods, properties, extendsClause, options) {
        const extendsStr = extendsClause?.length ? ` extends ${extendsClause.join(', ')}` : '';
        const members = [...properties, ...methods].join('\n\n  ');
        return `class ${name}${extendsStr} {\n  ${members}\n}`;
    }
    async generateMethodOverride(method, parentMethod, parentClass) {
        const params = method.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
        const returnType = method.returnType.name;
        return `override ${method.name}(${params}): ${returnType} {\n  return super.${method.name}(${method.parameters.map(p => p.name).join(', ')});\n}`;
    }
    async generateStubForPattern(pattern, options) {
        switch (pattern.usageType) {
            case 'function_call':
                return `function ${pattern.symbolName}() {\n  throw new Error("Not implemented");\n}`;
            case 'method_call':
                return `${pattern.symbolName}() {\n  throw new Error("Not implemented");\n}`;
            case 'property_access':
                return `${pattern.symbolName}: any;`;
            default:
                return `// TODO: Implement ${pattern.symbolName}`;
        }
    }
    async generateNotImplementedBody(pattern) {
        return 'throw new Error("Not implemented");';
    }
    async generateTestCodeForTarget(target, template, framework) {
        return template.replace(/\{\{TARGET_NAME\}\}/g, target.symbolName);
    }
    async generateTestImports(target, framework) {
        return [`import { ${target.symbolName} } from './${target.symbolName}';`];
    }
    async generateTestSetup(target, framework) {
        return 'beforeEach(() => {\n  // Setup\n});';
    }
    async generateTestTeardown(target, framework) {
        return 'afterEach(() => {\n  // Teardown\n});';
    }
    async generateRouteHandler(endpoint) {
        return `router.${endpoint.method.toLowerCase()}('${endpoint.path}', async (req, res) => {\n  // Handler implementation\n});`;
    }
    async generateMiddleware(middleware) {
        return `function ${middleware.name}(req, res, next) {\n  // Middleware implementation\n  next();\n}`;
    }
    async generateValidationSchema(schema) {
        return `const ${schema.name}Schema = {\n  // Schema definition\n};`;
    }
    async generateErrorHandler(errorHandling) {
        return `function errorHandler(err, req, res, next) {\n  // Error handling\n  res.status(500).json({ error: err.message });\n}`;
    }
    async generateRouterConfig(handlers, middleware) {
        return `const router = express.Router();\n\n${middleware.join('\n\n')}\n\n${handlers.join('\n\n')}\n\nexport default router;`;
    }
    async generateAPITypeDefinitions(specification) {
        return '// Generated API types';
    }
    async generateAPIDocumentation(specification) {
        return '# Generated API Documentation';
    }
}
//# sourceMappingURL=CodeGenerator.js.map