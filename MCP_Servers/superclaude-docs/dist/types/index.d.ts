export interface DocumentationRequest {
    type: DocumentationType;
    target: DocumentationTarget;
    specifications: DocumentationSpecs;
    language: string;
    format: OutputFormat;
    options: GenerationOptions;
}
export interface DocumentationType {
    category: "technical" | "user" | "educational" | "api" | "project" | "operational";
    subtype: string;
    template: string;
    customization: TemplateCustomization;
}
export interface DocumentationTarget {
    type: "codebase" | "api" | "project" | "feature" | "component";
    path: string;
    scope: string[];
    excludePatterns: string[];
    includeMetadata: boolean;
}
export interface DocumentationSpecs {
    docType: "technical" | "user" | "api" | "tutorial" | "reference";
    audience: "developer" | "enduser" | "administrator" | "beginner" | "expert";
    framework?: string;
    includeExamples: boolean;
    includeAPIReference: boolean;
    language: string;
}
export interface GenerationOptions {
    template?: string;
    customSections?: string[];
    generateTOC: boolean;
    includeAssets: boolean;
    validateAccessibility: boolean;
}
export interface APIDocumentation {
    title: string;
    content: string;
    endpoints: APIEndpoint[];
    schemas: APISchema[];
    authentication: AuthenticationMethod[];
    examples: APIExample[];
}
export interface APIEndpoint {
    path: string;
    method: string;
    description: string;
    parameters: APIParameter[];
    responses: APIResponse[];
}
export interface APIParameter {
    name: string;
    type: string;
    required: boolean;
    description: string;
}
export interface APIResponse {
    status: number;
    description: string;
    schema?: APISchema;
    example?: any;
}
export interface APISchema {
    name: string;
    type: string;
    properties: Record<string, any>;
}
export interface AuthenticationMethod {
    type: string;
    description: string;
    example: string;
}
export interface APIExample {
    title: string;
    request: string;
    response: string;
}
export interface ProductSpecification {
    name: string;
    version: string;
    description: string;
    features: ProductFeature[];
    requirements: ProductRequirement[];
    useCases: UseCase[];
}
export interface ProductFeature {
    name: string;
    description: string;
    category: string;
}
export interface ProductRequirement {
    type: string;
    description: string;
    mandatory: boolean;
}
export interface UseCase {
    title: string;
    description: string;
    steps: string[];
}
export interface AudienceProfile {
    type: string;
    expertise: string;
    goals: string[];
    preferences: AudiencePreference[];
}
export interface AudiencePreference {
    category: string;
    value: string;
}
export interface UserGuide {
    title: string;
    sections: UserGuideSection[];
    audience: AudienceProfile;
    version: string;
}
export interface UserGuideSection {
    id: string;
    title: string;
    content: string;
    order: number;
}
export interface TutorialTopic {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    prerequisites: string[];
    outcomes: string[];
}
export interface LearningPath {
    id: string;
    title: string;
    description: string;
    topics: TutorialTopic[];
    estimatedTime: number;
}
export interface Tutorial {
    title: string;
    topic: TutorialTopic;
    content: TutorialContent;
    interactive: boolean;
}
export interface TutorialContent {
    steps: TutorialStep[];
    examples: CodeExample[];
    exercises: Exercise[];
}
export interface TutorialStep {
    id: string;
    title: string;
    content: string;
    code?: CodeExample;
}
export interface CodeExample {
    language: string;
    code: string;
    description: string;
}
export interface Exercise {
    title: string;
    description: string;
    solution: string;
}
export interface ProjectContext {
    name: string;
    type: string;
    description: string;
    framework: string;
    version: string;
    dependencies: ProjectDependency[];
}
export interface ProjectDependency {
    name: string;
    version: string;
    type: string;
}
export interface READMEContent {
    title: string;
    description: string;
    installation: string;
    usage: string;
    api?: string;
    contributing?: string;
    license?: string;
}
export interface ChangeRecord {
    version: string;
    date: string;
    type: "added" | "changed" | "deprecated" | "removed" | "fixed" | "security";
    description: string;
}
export interface ChangelogFormat {
    style: "keepachangelog" | "conventional" | "custom";
    grouping: "type" | "date" | "component";
    includeBreaking: boolean;
}
export interface Changelog {
    format: ChangelogFormat;
    records: ChangeRecord[];
    unreleased: ChangeRecord[];
}
export interface TechnicalDocsSpecs extends DocumentationSpecs {
    docType: "technical";
    includeArchitecture: boolean;
    includePerformance: boolean;
    includeSecurity: boolean;
}
export interface TechnicalDocumentation {
    title: string;
    content: string;
    architecture?: ArchitectureDoc;
    performance?: PerformanceDoc;
    security?: SecurityDoc;
}
export interface ArchitectureDoc {
    overview: string;
    components: ComponentDoc[];
    patterns: PatternDoc[];
}
export interface ComponentDoc {
    name: string;
    description: string;
    responsibilities: string[];
    dependencies: string[];
}
export interface PatternDoc {
    name: string;
    description: string;
    implementation: string;
}
export interface PerformanceDoc {
    metrics: PerformanceMetric[];
    benchmarks: Benchmark[];
    optimization: OptimizationTip[];
}
export interface PerformanceMetric {
    name: string;
    value: string;
    description: string;
}
export interface Benchmark {
    name: string;
    results: BenchmarkResult[];
}
export interface BenchmarkResult {
    condition: string;
    value: number;
    unit: string;
}
export interface OptimizationTip {
    category: string;
    description: string;
    impact: string;
}
export interface SecurityDoc {
    threats: ThreatAssessment[];
    measures: SecurityMeasure[];
    compliance: ComplianceRequirement[];
}
export interface ThreatAssessment {
    threat: string;
    likelihood: string;
    impact: string;
    mitigation: string;
}
export interface SecurityMeasure {
    name: string;
    description: string;
    implementation: string;
}
export interface ComplianceRequirement {
    standard: string;
    requirement: string;
    status: string;
}
export interface RenderedContent {
    content: string;
    metadata: ContentMetadata;
    style: StyleDefinition[];
}
export interface TemplateRegistry extends Map<string, DocumentTemplate> {
}
export interface VariableResolver {
    resolve(variables: Record<string, any>, context: any): Promise<Record<string, any>>;
}
export interface SectionGenerator {
    generate(sectionType: string, context: any): Promise<GeneratedSection>;
}
export interface StyleApplicator {
    apply(content: string, styles: StyleDefinition[]): Promise<StyledContent>;
}
export interface RenderContext {
    template: DocumentTemplate;
    variables: Record<string, any>;
    context: any;
}
export interface CustomizedTemplate extends DocumentTemplate {
    customizations: TemplateCustomization[];
}
export interface TemplateValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface TemplateUsage {
    templateId: string;
    usageCount: number;
    lastUsed: Date;
    performance: PerformanceMetric[];
}
export interface OptimizedTemplate extends DocumentTemplate {
    optimizations: string[];
    performanceGain: number;
}
export interface ResolvedTemplate extends DocumentTemplate {
    resolvedVariables: Record<string, any>;
    unresolvedVariables: string[];
}
export interface GeneratedSection {
    id: string;
    content: string;
    metadata: SectionMetadata;
}
export interface SectionMetadata {
    type: string;
    order: number;
    dependencies: string[];
}
export interface StyledContent {
    content: string;
    appliedStyles: StyleDefinition[];
    cssClasses: string[];
}
export interface RenderValidation {
    isValid: boolean;
    issues: ValidationIssue[];
    performance: PerformanceMetric[];
}
export interface ValidationIssue {
    type: string;
    severity: "error" | "warning" | "info";
    message: string;
    location?: string;
}
export interface TemplateError extends Error {
    templateId: string;
    errorType: "syntax" | "runtime" | "validation";
    context?: any;
}
export interface DocumentationContent {
    title: string;
    content: string;
    metadata: ContentMetadata;
    structure: DocumentStructure;
    assets: ContentAsset[];
    translations: Translation[];
    quality: QualityMetrics;
}
export interface ContentMetadata {
    generated: Date;
    target: DocumentationTarget;
    specifications: DocumentationSpecs;
    template: string;
    language: string;
    persona?: string;
    qualityScore: number;
    type: string;
}
export interface DocumentStructure {
    sections: DocumentSection[];
    tableOfContents: TOCEntry[];
    crossReferences: CrossReference[];
    assets: AssetReference[];
}
export interface DocumentSection {
    title: string;
    content: string;
    level: number;
    subsections?: DocumentSection[];
    metadata?: SectionMetadata;
}
export interface TOCEntry {
    title: string;
    level: number;
    anchor: string;
    subsections?: TOCEntry[];
}
export interface CrossReference {
    from: string;
    to: string;
    type: "link" | "reference" | "citation";
    context: string;
}
export interface AssetReference {
    id: string;
    type: "image" | "diagram" | "code" | "file";
    path: string;
    description: string;
}
export interface ContentAsset {
    id: string;
    type: "image" | "diagram" | "code" | "file";
    content: string | Buffer;
    metadata: AssetMetadata;
}
export interface AssetMetadata {
    filename: string;
    size: number;
    format: string;
    generated: Date;
    description: string;
}
export interface SectionMetadata {
    level: number;
    anchor: string;
    generated: Date;
    wordCount: number;
    complexity: number;
}
export interface DocumentTemplate {
    id: string;
    name: string;
    type: DocumentationType;
    structure: TemplateStructure;
    variables: TemplateVariable[];
    sections: TemplateSection[];
    styles: TemplateStyle[];
    validation: TemplateValidation;
}
export interface TemplateStructure {
    sections: TemplateSectionDefinition[];
    variables: TemplateVariableDefinition[];
    styles: TemplateStyleDefinition[];
    metadata: TemplateMetadata;
}
export interface TemplateSectionDefinition {
    id: string;
    title: string;
    order: number;
    required: boolean;
    content: string;
    variables: string[];
}
export interface TemplateVariableDefinition {
    name: string;
    type: "string" | "number" | "boolean" | "array" | "object";
    required: boolean;
    default?: any;
    description: string;
}
export interface TemplateStyleDefinition {
    selector: string;
    properties: Record<string, string>;
    conditions?: StyleCondition[];
}
export interface TemplateMetadata {
    created: Date;
    updated: Date;
    version: string;
    author: string;
    description: string;
    category: string;
}
export interface TemplateVariable {
    name: string;
    type: string;
    value: any;
    description: string;
}
export interface TemplateSection {
    id: string;
    title: string;
    content: string;
    order: number;
    required: boolean;
}
export interface TemplateStyle {
    selector: string;
    properties: Record<string, string>;
}
export interface TemplateValidation {
    rules: ValidationRule[];
    required: boolean;
    errorHandling: string;
}
export interface TemplateCustomization {
    variables: Record<string, any>;
    sections: SectionCustomization[];
    styles: StyleCustomization[];
    metadata: CustomizationMetadata;
}
export interface SectionCustomization {
    sectionId: string;
    enabled: boolean;
    order?: number;
    content?: string;
    variables?: Record<string, any>;
}
export interface StyleCustomization {
    selector: string;
    properties: Record<string, string>;
    conditions?: StyleCondition[];
}
export interface StyleCondition {
    property: string;
    operator: "equals" | "contains" | "startsWith" | "endsWith";
    value: string;
}
export interface CustomizationMetadata {
    customizedBy: string;
    customizedAt: Date;
    version: string;
    description: string;
}
export interface LocalizationContext {
    sourceLanguage: string;
    targetLanguage: string;
    culturalContext: CulturalContext;
    localizationRules: LocalizationRule[];
    qualityThreshold: number;
    reviewProcess: ReviewProcess;
}
export interface CulturalContext {
    region: string;
    culture: string;
    formality: "formal" | "informal" | "neutral";
    preferences: CulturalPreferences;
    restrictions: CulturalRestrictions;
}
export interface CulturalPreferences {
    dateFormat: string;
    numberFormat: string;
    addressFormat: string;
    nameFormat: string;
    communicationStyle: string;
}
export interface CulturalRestrictions {
    forbiddenTopics: string[];
    sensitiveWords: string[];
    culturalTaboos: string[];
    regionalRestrictions: string[];
}
export interface LocalizationRule {
    id: string;
    type: "translation" | "cultural" | "formatting" | "validation";
    rule: string;
    description: string;
    priority: number;
}
export interface ReviewProcess {
    required: boolean;
    automated: boolean;
    humanReview: boolean;
    stages: ReviewStage[];
}
export interface ReviewStage {
    name: string;
    type: "automated" | "human";
    criteria: ReviewCriteria[];
    threshold: number;
}
export interface ReviewCriteria {
    name: string;
    weight: number;
    description: string;
    validationMethod: string;
}
export interface Translation {
    id: string;
    sourceLanguage: string;
    targetLanguage: string;
    originalContent: string;
    translatedContent: string;
    metadata: TranslationMetadata;
    quality: TranslationQuality;
}
export interface TranslationMetadata {
    translatedAt: Date;
    translatedBy: string;
    method: "ai_assisted" | "human" | "machine";
    culturalContext: CulturalContext;
    reviewStatus: "pending" | "approved" | "rejected";
}
export interface TranslationQuality {
    score: number;
    accuracy: number;
    fluency: number;
    culturalAdaptation: number;
    consistency: number;
    issues: TranslationIssue[];
}
export interface TranslationIssue {
    type: "accuracy" | "fluency" | "cultural" | "consistency";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    suggestion: string;
    location: IssueLocation;
}
export interface IssueLocation {
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
    context: string;
}
export interface KnowledgeBase {
    id: string;
    entries: KnowledgeEntry[];
    index: SearchIndex;
    taxonomy: ContentTaxonomy;
    relationships: ContentRelationship[];
    metadata: KnowledgeBaseMetadata;
}
export interface KnowledgeEntry {
    id: string;
    title: string;
    content: string;
    type: "document" | "concept" | "procedure" | "reference";
    category: string;
    tags: string[];
    metadata: KnowledgeEntryMetadata;
    relationships: EntryRelationship[];
}
export interface KnowledgeEntryMetadata {
    created: Date;
    updated: Date;
    author: string;
    version: string;
    language: string;
    source: string;
    quality: number;
}
export interface EntryRelationship {
    targetId: string;
    type: "related" | "prerequisite" | "followup" | "alternative";
    strength: number;
    description: string;
}
export interface SearchIndex {
    entries: IndexEntry[];
    metadata: IndexMetadata;
    searchConfiguration: SearchConfig;
    performance: IndexPerformance;
}
export interface IndexEntry {
    id: string;
    content: string;
    type: string;
    category: string;
    tags: string[];
    weight: number;
    embeddings?: number[];
    metadata: IndexEntryMetadata;
}
export interface IndexEntryMetadata {
    indexed: Date;
    source: string;
    language: string;
    quality: number;
    searchability: number;
}
export interface IndexMetadata {
    created: Date;
    updated: Date;
    version: string;
    entryCount: number;
    size: number;
}
export interface SearchConfig {
    enableSemanticSearch: boolean;
    enableFullText: boolean;
    enableFuzzySearch: boolean;
    defaultLanguage: string;
    searchWeights: SearchWeights;
}
export interface SearchWeights {
    title: number;
    content: number;
    tags: number;
    metadata: number;
    semantic: number;
}
export interface IndexPerformance {
    indexingTime: number;
    searchTime: number;
    memoryUsage: number;
    accuracy: number;
}
export interface ContentTaxonomy {
    categories: TaxonomyCategory[];
    tags: TaxonomyTag[];
    relationships: TaxonomyRelationship[];
    metadata: TaxonomyMetadata;
}
export interface TaxonomyCategory {
    id: string;
    name: string;
    description: string;
    parent?: string;
    children: string[];
    entryCount: number;
}
export interface TaxonomyTag {
    id: string;
    name: string;
    description: string;
    category: string;
    frequency: number;
    weight: number;
}
export interface TaxonomyRelationship {
    from: string;
    to: string;
    type: "parent" | "child" | "sibling" | "related";
    strength: number;
}
export interface TaxonomyMetadata {
    created: Date;
    updated: Date;
    version: string;
    categoriesCount: number;
    tagsCount: number;
}
export interface ContentRelationship {
    id: string;
    sourceId: string;
    targetId: string;
    type: "references" | "extends" | "depends_on" | "related_to";
    strength: number;
    description: string;
    metadata: RelationshipMetadata;
}
export interface RelationshipMetadata {
    created: Date;
    discoveredBy: string;
    confidence: number;
    validated: boolean;
}
export interface KnowledgeBaseMetadata {
    created: Date;
    updated: Date;
    version: string;
    owner: string;
    description: string;
    statistics: KnowledgeBaseStats;
}
export interface KnowledgeBaseStats {
    totalEntries: number;
    totalCategories: number;
    totalTags: number;
    totalRelationships: number;
    averageQuality: number;
    languages: string[];
}
export interface SearchQuery {
    query: string;
    type: "text" | "semantic" | "structured" | "hybrid";
    filters: SearchFilter[];
    options: SearchOptions;
    context: SearchContext;
}
export interface SearchFilter {
    field: string;
    operator: "equals" | "contains" | "range" | "in" | "not_in";
    value: any;
}
export interface SearchOptions {
    limit: number;
    offset: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
    includeMetadata: boolean;
    includeSnippets: boolean;
    highlightMatches: boolean;
}
export interface SearchContext {
    language: string;
    user: string;
    location: string;
    preferences: SearchPreferences;
}
export interface SearchPreferences {
    preferredLanguages: string[];
    preferredCategories: string[];
    qualityThreshold: number;
    maxResults: number;
}
export interface SearchResult {
    query: SearchQuery;
    results: SearchResultItem[];
    metadata: SearchResultMetadata;
    suggestions: SearchSuggestion[];
    performance: SearchPerformance;
}
export interface SearchResultItem {
    id: string;
    title: string;
    content: string;
    type: string;
    category: string;
    score: number;
    snippets: SearchSnippet[];
    metadata: SearchResultItemMetadata;
}
export interface SearchSnippet {
    text: string;
    startPosition: number;
    endPosition: number;
    highlights: HighlightSpan[];
}
export interface HighlightSpan {
    start: number;
    end: number;
    type: "match" | "context";
}
export interface SearchResultItemMetadata {
    source: string;
    language: string;
    quality: number;
    relevance: number;
    lastUpdated: Date;
}
export interface SearchResultMetadata {
    totalResults: number;
    searchTime: number;
    queryAnalysis: QueryAnalysis;
    filters: SearchFilter[];
}
export interface QueryAnalysis {
    intent: string;
    entities: string[];
    concepts: string[];
    language: string;
    complexity: number;
}
export interface SearchSuggestion {
    query: string;
    type: "correction" | "completion" | "alternative";
    confidence: number;
    explanation: string;
}
export interface SearchPerformance {
    searchTime: number;
    resultsCount: number;
    searchStrategy: string;
    cacheHit: boolean;
    indexesUsed: string[];
}
export interface QualityMetrics {
    overallScore: number;
    accuracy: number;
    completeness: number;
    consistency: number;
    accessibility: number;
    readability: number;
    issues: QualityIssue[];
}
export interface QualityIssue {
    id: string;
    type: "accuracy" | "completeness" | "consistency" | "accessibility" | "readability";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    location: IssueLocation;
    suggestion: string;
    autoFixable: boolean;
}
export interface ValidationRule {
    id: string;
    name: string;
    description: string;
    type: "structural" | "content" | "accessibility" | "localization";
    severity: "error" | "warning" | "info";
    autoFix: boolean;
    pattern?: string;
    validator: (content: string) => ValidationResult;
}
export interface ValidationResult {
    passed: boolean;
    issues: ValidationIssue[];
    score: number;
    suggestions: string[];
}
export interface ValidationIssue {
    rule: string;
    message: string;
    location: IssueLocation;
    severity: "error" | "warning" | "info";
    autoFixable: boolean;
    suggestion?: string;
}
export interface APISpecification {
    version: string;
    info: APIInfo;
    servers: APIServer[];
    paths: Record<string, APIPath>;
    components: APIComponents;
    security: APISecurityRequirement[];
}
export interface APIInfo {
    title: string;
    version: string;
    description: string;
    contact?: APIContact;
    license?: APILicense;
}
export interface APIContact {
    name: string;
    url: string;
    email: string;
}
export interface APILicense {
    name: string;
    url: string;
}
export interface APIServer {
    url: string;
    description: string;
    variables?: Record<string, APIServerVariable>;
}
export interface APIServerVariable {
    enum?: string[];
    default: string;
    description: string;
}
export interface APIPath {
    get?: APIOperation;
    post?: APIOperation;
    put?: APIOperation;
    delete?: APIOperation;
    patch?: APIOperation;
    head?: APIOperation;
    options?: APIOperation;
    trace?: APIOperation;
}
export interface APIOperation {
    summary: string;
    description: string;
    operationId: string;
    tags: string[];
    parameters: APIParameter[];
    requestBody?: APIRequestBody;
    responses: Record<string, APIResponse>;
    security?: APISecurityRequirement[];
}
export interface APIParameter {
    name: string;
    in: "query" | "header" | "path" | "cookie";
    required: boolean;
    schema: APISchema;
    description: string;
}
export interface APIRequestBody {
    description: string;
    content: Record<string, APIMediaType>;
    required: boolean;
}
export interface APIResponse {
    description: string;
    content?: Record<string, APIMediaType>;
    headers?: Record<string, APIHeader>;
}
export interface APIMediaType {
    schema: APISchema;
    examples?: Record<string, APIExample>;
}
export interface APIHeader {
    description: string;
    schema: APISchema;
}
export interface APIExample {
    summary: string;
    description: string;
    value: any;
}
export interface APISchema {
    type: string;
    format?: string;
    properties?: Record<string, APISchema>;
    items?: APISchema;
    required?: string[];
    description?: string;
}
export interface APIComponents {
    schemas?: Record<string, APISchema>;
    responses?: Record<string, APIResponse>;
    parameters?: Record<string, APIParameter>;
    examples?: Record<string, APIExample>;
    requestBodies?: Record<string, APIRequestBody>;
    headers?: Record<string, APIHeader>;
    securitySchemes?: Record<string, APISecurityScheme>;
}
export interface APISecurityScheme {
    type: "apiKey" | "http" | "oauth2" | "openIdConnect";
    description?: string;
    name?: string;
    in?: "query" | "header" | "cookie";
    scheme?: string;
    bearerFormat?: string;
    flows?: APISecurityFlows;
    openIdConnectUrl?: string;
}
export interface APISecurityFlows {
    implicit?: APISecurityFlow;
    password?: APISecurityFlow;
    clientCredentials?: APISecurityFlow;
    authorizationCode?: APISecurityFlow;
}
export interface APISecurityFlow {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes: Record<string, string>;
}
export interface APISecurityRequirement {
    [key: string]: string[];
}
export interface DocumentationResult {
    content: DocumentationContent;
    metadata: ContentMetadata;
    structure: DocumentStructure;
    assets: ContentAsset[];
    quality: QualityMetrics;
    suggestions: string[];
}
export interface LocalizationResult {
    originalContent: DocumentationContent;
    localizedContent: DocumentationContent;
    translationMetadata: TranslationMetadata;
    qualityValidation: QualityValidationResult;
    glossary?: TranslationGlossary;
    culturalAdaptations: CulturalAdaptation[];
    reviewStatus: "pending_review" | "approved" | "rejected";
    metadata: LocalizationResultMetadata;
}
export interface LocalizationResultMetadata {
    localizedAt: Date;
    targetLanguage: string;
    culturalContext: CulturalContext;
    persona: string;
    processingTime: number;
}
export interface QualityValidationResult {
    passed: boolean;
    score: number;
    issues: ValidationIssue[];
    suggestions: string[];
    requiresReview: boolean;
    requiresFixes: boolean;
}
export interface IndexingResult {
    success: boolean;
    indexedEntries: number;
    relationships: number;
    searchability: number;
    metadata: IndexingResultMetadata;
}
export interface IndexingResultMetadata {
    indexedAt: Date;
    contentType: string;
    language: string;
    processingTime: number;
}
export interface TranslationGlossary {
    id: string;
    terms: GlossaryTerm[];
    metadata: GlossaryMetadata;
}
export interface GlossaryTerm {
    source: string;
    target: string;
    context: string;
    frequency: number;
    confirmed: boolean;
}
export interface GlossaryMetadata {
    created: Date;
    updated: Date;
    sourceLanguage: string;
    targetLanguage: string;
    termCount: number;
}
export interface CulturalAdaptation {
    type: "example" | "reference" | "tone" | "formatting";
    original: string;
    adapted: string;
    reason: string;
    confidence: number;
}
export type OutputFormat = "markdown" | "html" | "pdf" | "docx" | "json";
export interface GenerationContext {
    target: DocumentationTarget;
    analysis: ContentAnalysis;
    patterns: DocumentationPattern[];
    specifications: DocumentationSpecs;
    language: string;
    audience: string;
    framework?: string;
    detectedFramework?: string;
}
export interface ContentAnalysis {
    structure: CodeStructure;
    complexity: number;
    dependencies: string[];
    frameworks: string[];
    languages: string[];
    apiEndpoints: APIEndpoint[];
    components: ComponentInfo[];
    features: string[];
}
export interface CodeStructure {
    directories: string[];
    files: string[];
    modules: string[];
    classes: string[];
    functions: string[];
    interfaces: string[];
}
export interface APIEndpoint {
    method: string;
    path: string;
    description: string;
    parameters: APIParameter[];
    responses: APIResponse[];
}
export interface ComponentInfo {
    name: string;
    type: string;
    path: string;
    description: string;
    props: ComponentProp[];
    methods: ComponentMethod[];
}
export interface ComponentProp {
    name: string;
    type: string;
    required: boolean;
    description: string;
    default?: string;
}
export interface ComponentMethod {
    name: string;
    parameters: MethodParameter[];
    returnType: string;
    description: string;
}
export interface MethodParameter {
    name: string;
    type: string;
    required: boolean;
    description: string;
}
export interface DocumentationPattern {
    id: string;
    name: string;
    description: string;
    category: string;
    template: string;
    examples: PatternExample[];
    metadata: PatternMetadata;
}
export interface PatternExample {
    title: string;
    description: string;
    code: string;
    language: string;
    framework: string;
}
export interface PatternMetadata {
    created: Date;
    updated: Date;
    author: string;
    version: string;
    popularity: number;
    framework: string;
}
export declare class DocumentationError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export declare class LocalizationError extends Error {
    code: string;
    language: string;
    details?: any | undefined;
    constructor(message: string, code: string, language: string, details?: any | undefined);
}
export declare class ValidationError extends Error {
    code: string;
    validationErrors: ValidationIssue[];
    details?: any | undefined;
    constructor(message: string, code: string, validationErrors: ValidationIssue[], details?: any | undefined);
}
export declare class TemplateError extends Error {
    code: string;
    templateId: string;
    details?: any | undefined;
    constructor(message: string, code: string, templateId: string, details?: any | undefined);
}
export declare class SearchError extends Error {
    code: string;
    query: string;
    details?: any | undefined;
    constructor(message: string, code: string, query: string, details?: any | undefined);
}
export interface DocsServerConfig {
    serverName: "superclaude-docs";
    capabilities: ["tools", "resources", "prompts"];
    documentGeneration: {
        enableTemplateEngine: boolean;
        enableContextAwareGeneration: boolean;
        enableAutomatedUpdates: boolean;
        maxDocumentSize: number;
        supportedFormats: OutputFormat[];
    };
    localization: {
        enableMultiLanguage: boolean;
        supportedLanguages: string[];
        enableCulturalAdaptation: boolean;
        enableTranslationValidation: boolean;
        translationQualityThreshold: number;
    };
    knowledgeManagement: {
        enableIntelligentIndexing: boolean;
        enableSemanticSearch: boolean;
        enableContentVersioning: boolean;
        enableAutomaticTagging: boolean;
        searchIndexSize: number;
    };
    contentQuality: {
        enableAccessibilityValidation: boolean;
        enableAccuracyChecking: boolean;
        enableConsistencyValidation: boolean;
        enableGrammarChecking: boolean;
        qualityThreshold: number;
    };
    integration: {
        enableContext7Integration: boolean;
        enablePersonaIntegration: boolean;
        enableIntelligenceIntegration: boolean;
        enableAutomatedSync: boolean;
    };
    performance: {
        enableCaching: boolean;
        cacheTTL: number;
        enableAsyncGeneration: boolean;
        maxConcurrentGenerations: number;
        enableProgressiveRendering: boolean;
    };
}
export type SupportedLanguage = "en" | "es" | "fr" | "de" | "ja" | "zh" | "pt" | "it" | "ru" | "ko";
export type DocumentationCategory = "technical" | "user" | "educational" | "api" | "project" | "operational";
export type QualityLevel = "low" | "medium" | "high" | "critical";
export type ValidationSeverity = "error" | "warning" | "info";
//# sourceMappingURL=index.d.ts.map