export interface Location {
  uri: string;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

export interface Position {
  line: number;
  character: number;
}

export interface SymbolReference {
  symbolId: string;
  location: Location;
  type: TypeInformation;
  scope: SymbolScope;
  dependencies: SymbolReference[];
  usages: Location[];
  name: string;
  kind: string;
  isExported?: boolean;
}

export interface TypeInformation {
  name: string;
  kind: 'primitive' | 'object' | 'array' | 'function' | 'class' | 'interface' | 'union' | 'generic';
  parameters?: TypeInformation[];
  returnType?: TypeInformation;
  properties?: { [key: string]: TypeInformation };
}

export interface SymbolScope {
  kind: 'global' | 'module' | 'class' | 'function' | 'block';
  name: string;
  range: Location['range'];
}

export interface SemanticProperty {
  type: string;
  value: any;
  preserved: boolean;
}

export interface TypeChange {
  before: TypeInformation;
  after: TypeInformation;
  impact: 'breaking' | 'compatible' | 'enhancement';
}

export interface ImportChange {
  type: 'add' | 'remove' | 'modify';
  module: string;
  symbols: string[];
  alias?: string;
}

export interface ExportChange {
  type: 'add' | 'remove' | 'modify';
  symbol: string;
  exportType: 'named' | 'default' | 'namespace';
}

export interface Transformation {
  sourceCode: string;
  targetCode: string;
  preservedSemantics: SemanticProperty[];
  typeChanges: TypeChange[];
  imports: ImportChange[];
  exports: ExportChange[];
}

export interface ModificationType {
  category: 'edit' | 'generate' | 'refactor' | 'transform';
  operation: string;
  scope: 'symbol' | 'method' | 'class' | 'file' | 'project';
  atomicity: 'single' | 'transaction';
}

export interface DependencyUpdate {
  symbolId: string;
  oldReference: SymbolReference;
  newReference: SymbolReference;
  updateType: 'rename' | 'move' | 'signature_change' | 'type_change';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface RollbackInformation {
  transactionId: string;
  originalState: string;
  affectedFiles: string[];
  timestamp: number;
}

export interface SemanticModification {
  type: ModificationType;
  targetSymbol: SymbolReference;
  transformation: Transformation;
  dependencies: DependencyUpdate[];
  validation: ValidationResult;
  rollbackInfo: RollbackInformation;
}

export interface RefactoringOperation {
  type: string;
  location: Location;
  oldText: string;
  newText: string;
  semanticValidation: boolean;
}

export interface RefactoringScope {
  scope: string;
  affectedFiles: string[];
  operation: string;
}

export interface RollbackData {
  transactionId: string;
  operations: RefactoringOperation[];
  originalState: { [file: string]: string };
  timestamp: number;
}

export interface TransactionStatus {
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'rolled_back';
  progress: number;
  message?: string;
}

export interface RefactoringTransaction {
  transactionId: string;
  operations: SemanticModification[];
  affectedFiles: string[];
  rollbackData: RollbackData;
  validationResults: ValidationResult[];
  status: TransactionStatus;
}

export interface ProjectType {
  language: 'typescript' | 'javascript' | 'python' | 'go' | 'rust';
  framework?: string;
  version?: string;
  buildTool?: string;
}

export interface Framework {
  name: string;
  version: string;
  conventions: FrameworkConventions;
  patterns: DesignPattern[];
  generators: SpecializedGenerator[];
  validators: FrameworkValidator[];
}

export interface FrameworkConventions {
  naming: { [key: string]: string };
  structure: { [key: string]: string };
  patterns: { [key: string]: any };
}

export interface DesignPattern {
  name: string;
  description: string;
  template: string;
  variables: { [key: string]: any };
  constraints: string[];
}

export interface SpecializedGenerator {
  type: string;
  generator: (context: any) => Promise<string>;
}

export interface FrameworkValidator {
  name: string;
  validate: (code: string) => ValidationResult;
}

export interface ExistingCodeContext {
  imports: ImportChange[];
  exports: ExportChange[];
  symbols: SymbolReference[];
  dependencies: string[];
}

export interface GenerationRequirements {
  type: string;
  name: string;
  description: string;
  parameters?: any[];
  returnType?: string;
  interfaces?: string[];
  requirements?: string[];
}

export interface GenerationConstraints {
  maxLines: number;
  conventions: FrameworkConventions;
  dependencies: string[];
  performance: any;
}

export interface CodeGenerationContext {
  projectType: ProjectType;
  framework: Framework | null;
  language: string;
  targetLocation: Location;
  existingCode: ExistingCodeContext;
  requirements: GenerationRequirements;
  constraints: GenerationConstraints;
}

export interface CodeSelection {
  uri: string;
  range: Location['range'];
  text: string;
}

export interface RenameOptions {
  forceRename?: boolean;
  includeComments?: boolean;
  previewMode?: boolean;
}

export interface ExtractionOptions {
  accessibility?: 'public' | 'private' | 'protected';
  generateComments?: boolean;
  insertionStrategy?: 'before_current' | 'after_current' | 'end_of_class';
}

export interface InlineOptions {
  preserveComments?: boolean;
  updateReferences?: boolean;
}

export interface MoveOptions {
  updateImports?: boolean;
  preserveAccessibility?: boolean;
}

export interface Signature {
  name: string;
  parameters: { name: string; type: TypeInformation; optional?: boolean }[];
  returnType: TypeInformation;
  accessibility?: 'public' | 'private' | 'protected';
}

export interface SignatureOptions {
  updateCallSites?: boolean;
  preserveOverloads?: boolean;
}

export interface RenameResult {
  success: boolean;
  affectedFiles: string[];
  changes: any[];
  rollbackId: string;
  conflicts?: any[];
  preview?: any;
}

export interface ExtractionResult {
  success: boolean;
  methodSignature: Signature;
  methodLocation: Location;
  callLocation: Location;
  methodCode?: string;
  rollbackId: string;
}

export interface InlineResult {
  success: boolean;
  affectedLocations: Location[];
  rollbackId: string;
}

export interface MoveResult {
  success: boolean;
  newLocation: Location;
  updatedImports: ImportChange[];
  rollbackId: string;
}

export interface SignatureResult {
  success: boolean;
  updatedCallSites: Location[];
  newSignature: Signature;
  rollbackId: string;
}

export interface RefactoringResult {
  success: boolean;
  affectedFiles: string[];
  changes: any[];
  rollbackId: string;
}

export interface GenerationResult {
  generatedCode: string;
  imports: ImportChange[];
  exports: ExportChange[];
  metadata: any;
}

export interface ComponentSpecification {
  name: string;
  props: any[];
  state?: any[];
  events?: any[];
  styling?: any;
  accessibility?: any;
  behavior?: string;
  includeTests?: boolean;
  includeStyles?: boolean;
  includeDocs?: boolean;
}

export interface ComponentResult {
  componentCode: string;
  propsInterface?: string;
  styles?: string;
  tests?: string;
  imports: string[];
  exports: string[];
}

export interface CodeTemplate {
  name: string;
  template: string;
  variables: { [key: string]: any };
  language: string;
  framework?: string;
}

export interface AtomicityValidation {
  isAtomic: boolean;
  conflicts: string[];
  dependencies: string[];
}

export interface IntegrityResult {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}

export interface ApplicationResult {
  success: boolean;
  appliedOperations: number;
  failedOperations: RefactoringOperation[];
}

export interface RollbackResult {
  success: boolean;
  restoredFiles: string[];
  errors: string[];
}

export interface ConflictReport {
  hasConflicts: boolean;
  conflicts: {
    type: string;
    description: string;
    affectedFiles: string[];
    resolution?: string;
  }[];
}

export interface RefactoringPreview {
  operations: RefactoringOperation[];
  affectedFiles: string[];
  estimatedImpact: string;
  potentialIssues: string[];
}

export interface BuildConfiguration {
  target: 'development' | 'production' | 'test';
  entryPoints: string[];
  outputDir: string;
  optimization?: {
    minify?: boolean;
    treeshake?: boolean;
    sourceMaps?: boolean;
    bundleSplitting?: boolean;
  };
  plugins?: string[];
  environment?: { [key: string]: string };
  framework?: string;
}

export interface CleanupScope {
  directories: string[];
  filePatterns: string[];
  preservePatterns: string[];
  dryRun: boolean;
}

export interface BuildResult {
  success: boolean;
  artifacts: string[];
  metrics: any;
  warnings: string[];
  errors: string[];
  duration: number;
}

export interface CleanupResult {
  deletedFiles: string[];
  deletedDirectories: string[];
  freedSpace: number;
  warnings: string[];
}

export interface PatternResult {
  success: boolean;
  generatedCode: string;
  appliedPattern: any;
  changes: any[];
  rollbackId?: string;
  recommendations?: string[];
}