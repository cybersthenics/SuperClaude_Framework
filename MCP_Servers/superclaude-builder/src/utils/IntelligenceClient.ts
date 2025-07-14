import { SymbolReference, Location, ValidationResult } from '../types/index.js';

export interface IntelligenceServerResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    processingTime: number;
    confidence: number;
    source: string;
  };
}

export interface SymbolInfo {
  symbol: SymbolReference;
  references: Location[];
  definition: Location;
  type: string;
  scope: string;
  documentation?: string;
}

export interface SemanticAnalysis {
  symbols: SymbolReference[];
  dependencies: { [key: string]: string[] };
  types: { [key: string]: any };
  issues: {
    type: 'error' | 'warning' | 'info';
    message: string;
    location: Location;
  }[];
}

export interface TypeInference {
  inferredType: string;
  confidence: number;
  alternatives: string[];
  reasoning: string;
}

export interface CodeContext {
  uri: string;
  range: Location['range'];
  surroundingCode: string;
  imports: string[];
  exports: string[];
  localVariables: string[];
  parentScope: string;
}

export class IntelligenceClient {
  private serverUrl: string;
  private timeout: number;
  private retryCount: number;

  constructor(serverUrl: string = 'http://localhost:8001', timeout: number = 5000) {
    this.serverUrl = serverUrl;
    this.timeout = timeout;
    this.retryCount = 3;
  }

  async getSymbolInfo(uri: string, position: { line: number; character: number }): Promise<SymbolReference | null> {
    try {
      const response = await this.makeRequest('/symbol/info', {
        uri,
        position
      });

      if (!response.success || !response.data) {
        return null;
      }

      return this.parseSymbolReference(response.data);
    } catch (error) {
      console.error('Failed to get symbol info:', error);
      return null;
    }
  }

  async findAllReferences(uri: string, position: { line: number; character: number }): Promise<Location[]> {
    try {
      const response = await this.makeRequest('/symbol/references', {
        uri,
        position
      });

      if (!response.success || !response.data) {
        return [];
      }

      return response.data.references || [];
    } catch (error) {
      console.error('Failed to find references:', error);
      return [];
    }
  }

  async getInterfaceMembers(symbol: SymbolReference): Promise<any> {
    try {
      const response = await this.makeRequest('/interface/members', {
        symbolId: symbol.symbolId,
        location: symbol.location
      });

      if (!response.success || !response.data) {
        return { methods: [], properties: [] };
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get interface members:', error);
      return { methods: [], properties: [] };
    }
  }

  async validateSymbolName(name: string, kind: string, scope: any): Promise<ValidationResult> {
    try {
      const response = await this.makeRequest('/symbol/validate-name', {
        name,
        kind,
        scope
      });

      if (!response.success) {
        return {
          isValid: false,
          errors: [response.error || 'Validation failed'],
          warnings: [],
          suggestions: []
        };
      }

      return response.data || {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        suggestions: []
      };
    }
  }

  async analyzeCode(uri: string, content?: string): Promise<SemanticAnalysis> {
    try {
      const response = await this.makeRequest('/code/analyze', {
        uri,
        content
      });

      if (!response.success || !response.data) {
        return {
          symbols: [],
          dependencies: {},
          types: {},
          issues: []
        };
      }

      return response.data;
    } catch (error) {
      console.error('Failed to analyze code:', error);
      return {
        symbols: [],
        dependencies: {},
        types: {},
        issues: []
      };
    }
  }

  async inferType(expression: string, context: CodeContext): Promise<TypeInference> {
    try {
      const response = await this.makeRequest('/type/infer', {
        expression,
        context
      });

      if (!response.success || !response.data) {
        return {
          inferredType: 'unknown',
          confidence: 0,
          alternatives: [],
          reasoning: 'Type inference failed'
        };
      }

      return response.data;
    } catch (error) {
      console.error('Failed to infer type:', error);
      return {
        inferredType: 'unknown',
        confidence: 0,
        alternatives: [],
        reasoning: `Type inference error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async validateSemantics(uri: string, content: string): Promise<ValidationResult> {
    try {
      const response = await this.makeRequest('/code/validate-semantics', {
        uri,
        content
      });

      if (!response.success) {
        return {
          isValid: false,
          errors: [response.error || 'Semantic validation failed'],
          warnings: [],
          suggestions: []
        };
      }

      return response.data || {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Semantic validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        suggestions: []
      };
    }
  }

  async getDefinition(uri: string, position: { line: number; character: number }): Promise<Location | null> {
    try {
      const response = await this.makeRequest('/symbol/definition', {
        uri,
        position
      });

      if (!response.success || !response.data) {
        return null;
      }

      return response.data.definition;
    } catch (error) {
      console.error('Failed to get definition:', error);
      return null;
    }
  }

  async getHover(uri: string, position: { line: number; character: number }): Promise<string | null> {
    try {
      const response = await this.makeRequest('/symbol/hover', {
        uri,
        position
      });

      if (!response.success || !response.data) {
        return null;
      }

      return response.data.hover;
    } catch (error) {
      console.error('Failed to get hover info:', error);
      return null;
    }
  }

  async getCompletions(uri: string, position: { line: number; character: number }): Promise<any[]> {
    try {
      const response = await this.makeRequest('/symbol/completions', {
        uri,
        position
      });

      if (!response.success || !response.data) {
        return [];
      }

      return response.data.completions || [];
    } catch (error) {
      console.error('Failed to get completions:', error);
      return [];
    }
  }

  async getSignatureHelp(uri: string, position: { line: number; character: number }): Promise<any | null> {
    try {
      const response = await this.makeRequest('/symbol/signature-help', {
        uri,
        position
      });

      if (!response.success || !response.data) {
        return null;
      }

      return response.data.signatureHelp;
    } catch (error) {
      console.error('Failed to get signature help:', error);
      return null;
    }
  }

  async getDiagnostics(uri: string): Promise<any[]> {
    try {
      const response = await this.makeRequest('/code/diagnostics', {
        uri
      });

      if (!response.success || !response.data) {
        return [];
      }

      return response.data.diagnostics || [];
    } catch (error) {
      console.error('Failed to get diagnostics:', error);
      return [];
    }
  }

  // Private helper methods
  private async makeRequest(endpoint: string, payload: any, retries: number = 0): Promise<IntelligenceServerResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.serverUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SuperClaude-Builder/1.0.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (retries < this.retryCount) {
        console.warn(`Request failed, retrying (${retries + 1}/${this.retryCount}):`, error);
        await this.delay(1000 * Math.pow(2, retries)); // Exponential backoff
        return this.makeRequest(endpoint, payload, retries + 1);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private parseSymbolReference(data: any): SymbolReference {
    return {
      symbolId: data.symbolId || 'unknown',
      location: data.location || { uri: '', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
      type: data.type || { name: 'unknown', kind: 'primitive' },
      scope: data.scope || { kind: 'module', name: 'unknown', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
      dependencies: data.dependencies || [],
      usages: data.usages || [],
      name: data.name || 'unknown',
      kind: data.kind || 'unknown',
      isExported: data.isExported || false
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check methods
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/health', {});
      return response.success;
    } catch (error) {
      return false;
    }
  }

  async getServerInfo(): Promise<any> {
    try {
      const response = await this.makeRequest('/info', {});
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Configuration methods
  setServerUrl(url: string): void {
    this.serverUrl = url;
  }

  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  setRetryCount(count: number): void {
    this.retryCount = count;
  }

  // Cache management
  async clearCache(): Promise<void> {
    try {
      await this.makeRequest('/cache/clear', {});
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getCacheStats(): Promise<any> {
    try {
      const response = await this.makeRequest('/cache/stats', {});
      return response.data;
    } catch (error) {
      return null;
    }
  }
}