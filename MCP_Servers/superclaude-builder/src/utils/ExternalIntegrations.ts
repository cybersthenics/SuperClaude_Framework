import { ComponentSpecification, ComponentResult, DesignPattern, ValidationResult } from '../types/index.js';

// Magic Server Integration
export interface MagicClient {
  generateComponent(specs: MagicComponentSpecs): Promise<MagicComponentResult>;
  getDesignSystem(framework: string): Promise<DesignSystemInfo>;
  validateDesign(component: string, constraints: any): Promise<ValidationResult>;
  optimizeComponent(component: string, target: string): Promise<string>;
}

export interface MagicComponentSpecs {
  framework: string;
  name: string;
  requirements: any;
  includeAccessibility: boolean;
  designSystem?: string;
  theme?: string;
}

export interface MagicComponentResult {
  success: boolean;
  component: string;
  styles: string;
  tests?: string;
  documentation?: string;
  accessibility: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  performance: {
    score: number;
    metrics: any;
    optimizations: string[];
  };
}

export interface DesignSystemInfo {
  name: string;
  version: string;
  tokens: { [key: string]: any };
  components: string[];
  patterns: string[];
  guidelines: string[];
}

export class MagicIntegration implements MagicClient {
  private serverUrl: string;
  private timeout: number;
  private apiKey?: string;

  constructor(serverUrl: string = 'http://localhost:8002', apiKey?: string) {
    this.serverUrl = serverUrl;
    this.timeout = 10000;
    this.apiKey = apiKey;
  }

  async generateComponent(specs: MagicComponentSpecs): Promise<MagicComponentResult> {
    try {
      const response = await this.makeRequest('/component/generate', specs);
      
      if (!response.success) {
        throw new Error(`Magic component generation failed: ${response.error}`);
      }

      return response.data;
    } catch (error) {
      console.error('Magic component generation failed:', error);
      return {
        success: false,
        component: '',
        styles: '',
        accessibility: { score: 0, issues: [], recommendations: [] },
        performance: { score: 0, metrics: {}, optimizations: [] }
      };
    }
  }

  async getDesignSystem(framework: string): Promise<DesignSystemInfo> {
    try {
      const response = await this.makeRequest('/design-system', { framework });
      
      if (!response.success) {
        throw new Error(`Failed to get design system: ${response.error}`);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get design system:', error);
      return {
        name: 'default',
        version: '1.0.0',
        tokens: {},
        components: [],
        patterns: [],
        guidelines: []
      };
    }
  }

  async validateDesign(component: string, constraints: any): Promise<ValidationResult> {
    try {
      const response = await this.makeRequest('/component/validate', {
        component,
        constraints
      });

      if (!response.success) {
        return {
          isValid: false,
          errors: [response.error || 'Design validation failed'],
          warnings: [],
          suggestions: []
        };
      }

      return response.data;
    } catch (error) {
      return {
        isValid: false,
        errors: [`Design validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        suggestions: []
      };
    }
  }

  async optimizeComponent(component: string, target: string): Promise<string> {
    try {
      const response = await this.makeRequest('/component/optimize', {
        component,
        target
      });

      if (!response.success) {
        throw new Error(`Component optimization failed: ${response.error}`);
      }

      return response.data.optimizedComponent;
    } catch (error) {
      console.error('Component optimization failed:', error);
      return component; // Return original if optimization fails
    }
  }

  private async makeRequest(endpoint: string, payload: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'User-Agent': 'SuperClaude-Builder/1.0.0'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.serverUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

// Context7 Server Integration
export interface Context7Client {
  getPatternDocumentation(patternName: string): Promise<PatternDocumentation>;
  getFrameworkPatterns(framework: string): Promise<DesignPattern[]>;
  getBestPractices(domain: string): Promise<BestPractices>;
  searchPatterns(query: string): Promise<PatternSearchResult[]>;
  getLibraryDocumentation(libraryName: string): Promise<LibraryDocumentation>;
}

export interface PatternDocumentation {
  name: string;
  description: string;
  category: string;
  intent: string;
  structure: any;
  participants: string[];
  collaborations: string[];
  consequences: string[];
  implementation: {
    code: string;
    language: string;
    framework?: string;
  }[];
  examples: {
    title: string;
    code: string;
    explanation: string;
  }[];
  relatedPatterns: string[];
  benefits: string[];
  drawbacks: string[];
  whenToUse: string[];
  whenNotToUse: string[];
}

export interface BestPractices {
  domain: string;
  practices: {
    title: string;
    description: string;
    category: string;
    importance: 'high' | 'medium' | 'low';
    examples: string[];
    antiPatterns: string[];
  }[];
  guidelines: string[];
  resources: string[];
}

export interface PatternSearchResult {
  name: string;
  description: string;
  category: string;
  relevance: number;
  framework?: string;
  language?: string;
}

export interface LibraryDocumentation {
  name: string;
  version: string;
  description: string;
  installation: string;
  usage: {
    quickStart: string;
    examples: {
      title: string;
      code: string;
      description: string;
    }[];
  };
  api: {
    functions: any[];
    classes: any[];
    interfaces: any[];
    types: any[];
  };
  patterns: DesignPattern[];
  bestPractices: string[];
}

export class Context7Integration implements Context7Client {
  private serverUrl: string;
  private timeout: number;
  private apiKey?: string;

  constructor(serverUrl: string = 'http://localhost:8003', apiKey?: string) {
    this.serverUrl = serverUrl;
    this.timeout = 15000;
    this.apiKey = apiKey;
  }

  async getPatternDocumentation(patternName: string): Promise<PatternDocumentation> {
    try {
      const response = await this.makeRequest('/pattern/documentation', {
        name: patternName
      });

      if (!response.success) {
        throw new Error(`Failed to get pattern documentation: ${response.error}`);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get pattern documentation:', error);
      return {
        name: patternName,
        description: `Pattern: ${patternName}`,
        category: 'unknown',
        intent: 'Not available',
        structure: {},
        participants: [],
        collaborations: [],
        consequences: [],
        implementation: [],
        examples: [],
        relatedPatterns: [],
        benefits: [],
        drawbacks: [],
        whenToUse: [],
        whenNotToUse: []
      };
    }
  }

  async getFrameworkPatterns(framework: string): Promise<DesignPattern[]> {
    try {
      const response = await this.makeRequest('/framework/patterns', {
        framework
      });

      if (!response.success) {
        throw new Error(`Failed to get framework patterns: ${response.error}`);
      }

      return response.data.patterns || [];
    } catch (error) {
      console.error('Failed to get framework patterns:', error);
      return [];
    }
  }

  async getBestPractices(domain: string): Promise<BestPractices> {
    try {
      const response = await this.makeRequest('/best-practices', {
        domain
      });

      if (!response.success) {
        throw new Error(`Failed to get best practices: ${response.error}`);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get best practices:', error);
      return {
        domain,
        practices: [],
        guidelines: [],
        resources: []
      };
    }
  }

  async searchPatterns(query: string): Promise<PatternSearchResult[]> {
    try {
      const response = await this.makeRequest('/pattern/search', {
        query
      });

      if (!response.success) {
        throw new Error(`Pattern search failed: ${response.error}`);
      }

      return response.data.results || [];
    } catch (error) {
      console.error('Pattern search failed:', error);
      return [];
    }
  }

  async getLibraryDocumentation(libraryName: string): Promise<LibraryDocumentation> {
    try {
      const response = await this.makeRequest('/library/documentation', {
        name: libraryName
      });

      if (!response.success) {
        throw new Error(`Failed to get library documentation: ${response.error}`);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get library documentation:', error);
      return {
        name: libraryName,
        version: '1.0.0',
        description: 'Library documentation not available',
        installation: '',
        usage: {
          quickStart: '',
          examples: []
        },
        api: {
          functions: [],
          classes: [],
          interfaces: [],
          types: []
        },
        patterns: [],
        bestPractices: []
      };
    }
  }

  private async makeRequest(endpoint: string, payload: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'User-Agent': 'SuperClaude-Builder/1.0.0'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.serverUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

// Integration factory for easy setup
export class ExternalIntegrations {
  private magicClient: MagicClient;
  private context7Client: Context7Client;

  constructor(config: {
    magic?: { url?: string; apiKey?: string };
    context7?: { url?: string; apiKey?: string };
  } = {}) {
    this.magicClient = new MagicIntegration(
      config.magic?.url,
      config.magic?.apiKey
    );
    
    this.context7Client = new Context7Integration(
      config.context7?.url,
      config.context7?.apiKey
    );
  }

  getMagicClient(): MagicClient {
    return this.magicClient;
  }

  getContext7Client(): Context7Client {
    return this.context7Client;
  }

  async healthCheck(): Promise<{
    magic: boolean;
    context7: boolean;
  }> {
    const results = await Promise.allSettled([
      this.checkMagicHealth(),
      this.checkContext7Health()
    ]);

    return {
      magic: results[0].status === 'fulfilled' && results[0].value,
      context7: results[1].status === 'fulfilled' && results[1].value
    };
  }

  private async checkMagicHealth(): Promise<boolean> {
    try {
      // Simple health check by attempting to get design system info
      await this.magicClient.getDesignSystem('react');
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkContext7Health(): Promise<boolean> {
    try {
      // Simple health check by attempting to search patterns
      await this.context7Client.searchPatterns('test');
      return true;
    } catch (error) {
      return false;
    }
  }
}