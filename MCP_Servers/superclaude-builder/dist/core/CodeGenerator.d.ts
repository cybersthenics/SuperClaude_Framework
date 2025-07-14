import { CodeGenerationContext, GenerationResult, ComponentSpecification, ComponentResult, CodeTemplate, Framework, ValidationResult, TypeInformation } from '../types/index.js';
export interface FrameworkDetector {
    detectFramework(projectRoot: string): Promise<Framework | null>;
    getFrameworkConventions(framework: Framework): Promise<any>;
}
export interface TemplateEngine {
    loadTemplate(templateName: string, language: string, framework?: string): Promise<CodeTemplate>;
    renderTemplate(template: CodeTemplate, variables: {
        [key: string]: any;
    }): Promise<string>;
    getAvailableTemplates(language: string, framework?: string): Promise<string[]>;
}
export interface ContextAnalyzer {
    analyzeContext(context: CodeGenerationContext): Promise<any>;
    inferRequirements(context: CodeGenerationContext): Promise<any>;
    analyzeExistingCode(uri: string): Promise<any>;
}
export interface SemanticValidator {
    validateGeneratedCode(code: string, context: CodeGenerationContext): Promise<ValidationResult>;
    validateSyntax(code: string, language: string): Promise<ValidationResult>;
    validateSemantics(code: string, context: CodeGenerationContext): Promise<ValidationResult>;
}
export interface TestTarget {
    uri: string;
    symbolName: string;
    symbolType: 'function' | 'class' | 'method' | 'component';
    testType: 'unit' | 'integration' | 'e2e';
}
export interface TestFramework {
    name: string;
    version: string;
    testFileExtension: string;
    generateTestTemplate: (target: TestTarget) => Promise<string>;
}
export interface APISpecification {
    endpoints: any[];
    middleware?: any[];
    schemas?: any[];
    errorHandling?: any;
}
export interface EndpointResult {
    routeHandlers: string[];
    middleware: string[];
    schemas: string[];
    errorHandlers: string[];
    routerConfig: string;
    typeDefinitions: string;
    documentation: string;
}
export interface InterfaceDefinition {
    name: string;
    methods: any[];
    properties: any[];
    extends?: string[];
}
export interface ImplementationOptions {
    generateStubs?: boolean;
    includeComments?: boolean;
    overrideExisting?: boolean;
}
export interface ImplementationResult {
    implementation: string;
    methods: string[];
    properties: string[];
}
export interface MethodDefinition {
    name: string;
    parameters: any[];
    returnType: TypeInformation;
    accessibility?: string;
}
export interface ClassDefinition {
    name: string;
    methods: MethodDefinition[];
    properties: any[];
    extends?: string;
    implements?: string[];
}
export interface OverrideResult {
    overriddenMethod: string;
    callsSuper: boolean;
    preservedBehavior: boolean;
}
export interface UsagePattern {
    symbolName: string;
    usageType: 'function_call' | 'method_call' | 'property_access';
    expectedSignature?: any;
}
export interface StubOptions {
    includeTypes?: boolean;
    generateDocumentation?: boolean;
    throwNotImplemented?: boolean;
}
export interface StubResult {
    stubs: string[];
    implementations: string[];
}
export interface TestResult {
    testCode: string;
    imports: string[];
    setup: string;
    teardown: string;
}
export declare class CodeGenerator {
    private frameworkDetector;
    private templateEngine;
    private contextAnalyzer;
    private semanticValidator;
    constructor(frameworkDetector: FrameworkDetector, templateEngine: TemplateEngine, contextAnalyzer: ContextAnalyzer, semanticValidator: SemanticValidator);
    generateCode(context: CodeGenerationContext, template: CodeTemplate): Promise<GenerationResult>;
    generateUIComponent(specs: ComponentSpecification, framework: Framework): Promise<ComponentResult>;
    implementInterface(interfaceDef: InterfaceDefinition, options?: ImplementationOptions): Promise<ImplementationResult>;
    overrideMethod(method: MethodDefinition, parentClass: ClassDefinition): Promise<OverrideResult>;
    generateStubs(usage: UsagePattern[], options?: StubOptions): Promise<StubResult>;
    generateTests(target: TestTarget, framework: TestFramework): Promise<TestResult>;
    generateAPIEndpoints(specification: APISpecification): Promise<EndpointResult>;
    private analyzeGenerationContext;
    private selectOptimalTemplate;
    private selectTemplateByType;
    private prepareTemplateVariables;
    private validateGeneratedCode;
    private optimizeGeneratedCode;
    private extractImports;
    private extractExports;
    private generatePropsInterface;
    private generateComponentStyles;
    private generateComponentTests;
    private validateComponentCode;
    private extractComponentImports;
    private generateMethodImplementation;
    private generatePropertyImplementation;
    private generateClassImplementation;
    private generateMethodOverride;
    private generateStubForPattern;
    private generateNotImplementedBody;
    private generateTestCodeForTarget;
    private generateTestImports;
    private generateTestSetup;
    private generateTestTeardown;
    private generateRouteHandler;
    private generateMiddleware;
    private generateValidationSchema;
    private generateErrorHandler;
    private generateRouterConfig;
    private generateAPITypeDefinitions;
    private generateAPIDocumentation;
}
//# sourceMappingURL=CodeGenerator.d.ts.map