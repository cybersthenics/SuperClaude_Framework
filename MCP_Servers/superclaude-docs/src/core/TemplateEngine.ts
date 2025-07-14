import {
  DocumentTemplate,
  TemplateRegistry,
  VariableResolver,
  SectionGenerator,
  StyleApplicator,
  RenderContext,
  RenderedContent,
  TemplateCustomization,
  CustomizedTemplate,
  TemplateValidation,
  TemplateUsage,
  OptimizedTemplate,
  ResolvedTemplate,
  GeneratedSection,
  StyleDefinition,
  StyledContent,
  RenderValidation,
  DocsServerConfig,
  TemplateError
} from '../types/index.js';
import { Logger } from '../utils/Logger.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';
import { CacheManager } from '../utils/CacheManager.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { marked } from 'marked';
import * as Handlebars from 'handlebars';

export class TemplateEngine {
  private templateRegistry: TemplateRegistry;
  private variableResolver: VariableResolver;
  private sectionGenerator: SectionGenerator;
  private styleApplicator: StyleApplicator;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private cacheManager: CacheManager;
  private config: DocsServerConfig;
  private handlebars: typeof Handlebars;

  constructor(config: DocsServerConfig) {
    this.config = config;
    this.logger = new Logger('TemplateEngine');
    this.performanceMonitor = new PerformanceMonitor();
    this.cacheManager = new CacheManager(config.performance.cacheTTL);
    
    this.templateRegistry = new Map();
    this.variableResolver = new VariableResolverImpl();
    this.sectionGenerator = new SectionGeneratorImpl();
    this.styleApplicator = new StyleApplicatorImpl();
    this.handlebars = Handlebars.create();
    
    this.initializeTemplateEngine();
    this.logger.info('TemplateEngine initialized');
  }

  async loadTemplate(templateId: string): Promise<DocumentTemplate> {
    const startTime = Date.now();
    this.logger.debug('Loading template', { templateId });

    try {
      // Check cache first
      const cacheKey = `template:${templateId}`;
      const cachedTemplate = await this.cacheManager.get<DocumentTemplate>(cacheKey);
      if (cachedTemplate) {
        this.logger.debug('Template served from cache', { templateId });
        return cachedTemplate;
      }

      // Load from registry
      if (this.templateRegistry.has(templateId)) {
        const template = this.templateRegistry.get(templateId)!;
        await this.cacheManager.set(cacheKey, template);
        return template;
      }

      // Load from file system
      const template = await this.loadTemplateFromFile(templateId);
      
      // Validate template
      const validation = await this.validateTemplate(template);
      if (!validation.isValid) {
        throw new TemplateError(
          `Template validation failed: ${validation.errors.join(', ')}`,
          'TEMPLATE_VALIDATION_ERROR',
          templateId,
          validation.errors
        );
      }

      // Cache and register
      this.templateRegistry.set(templateId, template);
      await this.cacheManager.set(cacheKey, template);

      const processingTime = Date.now() - startTime;
      await this.performanceMonitor.recordMetric('template_load', processingTime);

      this.logger.debug('Template loaded successfully', { templateId, processingTime });
      return template;

    } catch (error) {
      this.logger.error('Template loading failed', { error, templateId });
      throw error;
    }
  }

  async renderTemplate(template: DocumentTemplate, context: RenderContext): Promise<RenderedContent> {
    const startTime = Date.now();
    this.logger.debug('Rendering template', { templateId: template.id });

    try {
      // Resolve variables
      const resolvedTemplate = await this.resolveVariables(template, context);
      
      // Generate sections
      const generatedSections = await this.generateSections(resolvedTemplate, context);
      
      // Apply styles
      const styledContent = await this.applyStyles(
        generatedSections.map(s => s.content).join('\n\n'),
        template.styles
      );
      
      // Validate rendered content
      const validation = await this.validateRenderedContent({
        content: styledContent.content,
        metadata: {
          templateId: template.id,
          rendered: new Date(),
          variables: context.variables || {},
          sections: generatedSections.length
        },
        sections: generatedSections,
        assets: []
      });

      const processingTime = Date.now() - startTime;
      await this.performanceMonitor.recordMetric('template_render', processingTime);

      const result: RenderedContent = {
        content: styledContent.content,
        metadata: {
          templateId: template.id,
          rendered: new Date(),
          variables: context.variables || {},
          sections: generatedSections.length,
          processingTime,
          validation: validation.passed
        },
        sections: generatedSections,
        assets: styledContent.assets || []
      };

      this.logger.debug('Template rendered successfully', { 
        templateId: template.id, 
        processingTime,
        contentLength: result.content.length
      });

      return result;

    } catch (error) {
      this.logger.error('Template rendering failed', { error, templateId: template.id });
      throw error;
    }
  }

  async customizeTemplate(
    template: DocumentTemplate, 
    customization: TemplateCustomization
  ): Promise<CustomizedTemplate> {
    const startTime = Date.now();
    this.logger.debug('Customizing template', { templateId: template.id });

    try {
      const customizedTemplate: CustomizedTemplate = {
        ...template,
        id: `${template.id}-customized-${Date.now()}`,
        customization,
        metadata: {
          ...template.metadata,
          customizedAt: new Date(),
          originalTemplateId: template.id
        }
      };

      // Apply variable customizations
      if (customization.variables) {
        customizedTemplate.variables = template.variables.map(variable => ({
          ...variable,
          value: customization.variables[variable.name] || variable.value
        }));
      }

      // Apply section customizations
      if (customization.sections) {
        customizedTemplate.sections = template.sections.map(section => {
          const sectionCustomization = customization.sections.find(
            sc => sc.sectionId === section.id
          );
          
          if (sectionCustomization) {
            return {
              ...section,
              enabled: sectionCustomization.enabled,
              order: sectionCustomization.order || section.order,
              content: sectionCustomization.content || section.content
            };
          }
          
          return section;
        });
      }

      // Apply style customizations
      if (customization.styles) {
        customizedTemplate.styles = [
          ...template.styles,
          ...customization.styles.map(style => ({
            selector: style.selector,
            properties: style.properties
          }))
        ];
      }

      // Validate customized template
      const validation = await this.validateTemplate(customizedTemplate);
      if (!validation.isValid) {
        this.logger.warn('Customized template validation failed', { 
          templateId: template.id,
          errors: validation.errors
        });
      }

      const processingTime = Date.now() - startTime;
      await this.performanceMonitor.recordMetric('template_customize', processingTime);

      this.logger.debug('Template customized successfully', { 
        templateId: template.id,
        customizedTemplateId: customizedTemplate.id,
        processingTime
      });

      return customizedTemplate;

    } catch (error) {
      this.logger.error('Template customization failed', { error, templateId: template.id });
      throw error;
    }
  }

  async validateTemplate(template: DocumentTemplate): Promise<TemplateValidation> {
    this.logger.debug('Validating template', { templateId: template.id });

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate basic structure
      if (!template.id || typeof template.id !== 'string') {
        errors.push('Template ID is required and must be a string');
      }

      if (!template.name || typeof template.name !== 'string') {
        errors.push('Template name is required and must be a string');
      }

      // Validate sections
      if (!template.sections || !Array.isArray(template.sections)) {
        errors.push('Template sections must be an array');
      } else {
        template.sections.forEach((section, index) => {
          if (!section.id) {
            errors.push(`Section ${index} is missing ID`);
          }
          if (!section.title) {
            errors.push(`Section ${index} is missing title`);
          }
          if (typeof section.content !== 'string') {
            errors.push(`Section ${index} content must be a string`);
          }
        });
      }

      // Validate variables
      if (template.variables && Array.isArray(template.variables)) {
        template.variables.forEach((variable, index) => {
          if (!variable.name) {
            errors.push(`Variable ${index} is missing name`);
          }
          if (!variable.type) {
            errors.push(`Variable ${index} is missing type`);
          }
          if (variable.required && variable.value === undefined) {
            warnings.push(`Required variable ${variable.name} has no default value`);
          }
        });
      }

      // Validate styles
      if (template.styles && Array.isArray(template.styles)) {
        template.styles.forEach((style, index) => {
          if (!style.selector) {
            errors.push(`Style ${index} is missing selector`);
          }
          if (!style.properties || typeof style.properties !== 'object') {
            errors.push(`Style ${index} properties must be an object`);
          }
        });
      }

      // Validate Handlebars syntax
      if (template.sections) {
        for (const section of template.sections) {
          try {
            this.handlebars.compile(section.content);
          } catch (handlebarsError) {
            errors.push(`Invalid Handlebars syntax in section ${section.id}: ${handlebarsError.message}`);
          }
        }
      }

      const result: TemplateValidation = {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedAt: new Date(),
        templateId: template.id
      };

      this.logger.debug('Template validation completed', {
        templateId: template.id,
        isValid: result.isValid,
        errorCount: errors.length,
        warningCount: warnings.length
      });

      return result;

    } catch (error) {
      this.logger.error('Template validation failed', { error, templateId: template.id });
      throw error;
    }
  }

  async optimizeTemplate(template: DocumentTemplate, usage: TemplateUsage): Promise<OptimizedTemplate> {
    const startTime = Date.now();
    this.logger.debug('Optimizing template', { templateId: template.id });

    try {
      const optimizedTemplate: OptimizedTemplate = {
        ...template,
        id: `${template.id}-optimized-${Date.now()}`,
        optimization: {
          appliedAt: new Date(),
          originalTemplateId: template.id,
          usageMetrics: usage,
          optimizations: []
        }
      };

      // Optimize sections based on usage
      if (usage.sectionUsage) {
        optimizedTemplate.sections = template.sections
          .filter(section => usage.sectionUsage[section.id]?.usage > 0.1) // Remove rarely used sections
          .sort((a, b) => (usage.sectionUsage[b.id]?.usage || 0) - (usage.sectionUsage[a.id]?.usage || 0)); // Sort by usage
        
        optimizedTemplate.optimization.optimizations.push('Filtered and sorted sections by usage');
      }

      // Optimize variables
      if (usage.variableUsage) {
        optimizedTemplate.variables = template.variables.filter(
          variable => usage.variableUsage[variable.name]?.usage > 0.05
        );
        
        optimizedTemplate.optimization.optimizations.push('Removed unused variables');
      }

      // Optimize styles
      if (usage.styleUsage) {
        optimizedTemplate.styles = template.styles.filter(
          style => usage.styleUsage[style.selector]?.usage > 0.1
        );
        
        optimizedTemplate.optimization.optimizations.push('Removed unused styles');
      }

      // Cache compiled templates
      for (const section of optimizedTemplate.sections) {
        try {
          const compiled = this.handlebars.compile(section.content);
          optimizedTemplate.optimization.compiledSections = optimizedTemplate.optimization.compiledSections || {};
          optimizedTemplate.optimization.compiledSections[section.id] = compiled;
        } catch (error) {
          this.logger.warn('Failed to compile section for optimization', { 
            sectionId: section.id,
            error 
          });
        }
      }

      const processingTime = Date.now() - startTime;
      await this.performanceMonitor.recordMetric('template_optimize', processingTime);

      this.logger.debug('Template optimized successfully', {
        templateId: template.id,
        optimizedTemplateId: optimizedTemplate.id,
        optimizations: optimizedTemplate.optimization.optimizations.length,
        processingTime
      });

      return optimizedTemplate;

    } catch (error) {
      this.logger.error('Template optimization failed', { error, templateId: template.id });
      throw error;
    }
  }

  private async resolveVariables(template: DocumentTemplate, context: RenderContext): Promise<ResolvedTemplate> {
    const resolvedTemplate: ResolvedTemplate = {
      ...template,
      resolvedVariables: {}
    };

    // Resolve template variables
    for (const variable of template.variables) {
      const value = await this.variableResolver.resolve(variable, context);
      resolvedTemplate.resolvedVariables[variable.name] = value;
    }

    // Resolve context variables
    if (context.variables) {
      for (const [name, value] of Object.entries(context.variables)) {
        resolvedTemplate.resolvedVariables[name] = value;
      }
    }

    return resolvedTemplate;
  }

  private async generateSections(template: ResolvedTemplate, context: RenderContext): Promise<GeneratedSection[]> {
    const sections: GeneratedSection[] = [];

    for (const section of template.sections) {
      try {
        const generatedSection = await this.sectionGenerator.generate(
          section,
          template.resolvedVariables,
          context
        );
        sections.push(generatedSection);
      } catch (error) {
        this.logger.error('Section generation failed', { 
          sectionId: section.id,
          error 
        });
        throw error;
      }
    }

    return sections;
  }

  private async applyStyles(content: string, styles: StyleDefinition[]): Promise<StyledContent> {
    return await this.styleApplicator.apply(content, styles);
  }

  private async validateRenderedContent(content: RenderedContent): Promise<RenderValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate content structure
    if (!content.content || typeof content.content !== 'string') {
      errors.push('Rendered content must be a string');
    }

    // Validate content length
    if (content.content && content.content.length === 0) {
      warnings.push('Rendered content is empty');
    }

    // Validate sections
    if (!content.sections || !Array.isArray(content.sections)) {
      errors.push('Rendered content must have sections array');
    }

    // Validate metadata
    if (!content.metadata || typeof content.metadata !== 'object') {
      errors.push('Rendered content must have metadata object');
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date(),
      contentLength: content.content?.length || 0
    };
  }

  private async loadTemplateFromFile(templateId: string): Promise<DocumentTemplate> {
    const templatePath = path.join(__dirname, '../../templates', `${templateId}.yaml`);
    
    try {
      const fileContent = await fs.readFile(templatePath, 'utf-8');
      const templateData = yaml.parse(fileContent);
      
      return {
        id: templateId,
        name: templateData.name || templateId,
        type: templateData.type || { category: 'technical' },
        structure: templateData.structure || { sections: [], variables: [], styles: [] },
        variables: templateData.variables || [],
        sections: templateData.sections || [],
        styles: templateData.styles || [],
        validation: { rules: [], required: false, errorHandling: 'warn' },
        metadata: {
          created: new Date(),
          updated: new Date(),
          version: templateData.version || '1.0.0',
          author: templateData.author || 'system',
          description: templateData.description || '',
          category: templateData.category || 'technical'
        }
      };
    } catch (error) {
      throw new TemplateError(
        `Failed to load template from file: ${templatePath}`,
        'TEMPLATE_FILE_ERROR',
        templateId,
        error
      );
    }
  }

  private async initializeTemplateEngine(): Promise<void> {
    // Register Handlebars helpers
    this.handlebars.registerHelper('formatDate', (date: Date) => {
      return date.toISOString().split('T')[0];
    });

    this.handlebars.registerHelper('capitalize', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    this.handlebars.registerHelper('join', (array: string[], separator: string) => {
      return array.join(separator);
    });

    this.handlebars.registerHelper('markdown', (text: string) => {
      return marked(text);
    });

    this.handlebars.registerHelper('if_eq', function(a: any, b: any, options: any) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    this.handlebars.registerHelper('unless_eq', function(a: any, b: any, options: any) {
      if (a !== b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // Load default templates
    await this.loadDefaultTemplates();
  }

  private async loadDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      'technical-default-technical',
      'technical-default-user',
      'technical-default-api',
      'technical-react-technical',
      'technical-vue-technical',
      'technical-angular-technical',
      'api-openapi-interactive',
      'api-openapi-static',
      'readme-library',
      'readme-application',
      'changelog-keepachangelog',
      'tutorial-beginner',
      'tutorial-intermediate',
      'tutorial-advanced'
    ];

    for (const templateId of defaultTemplates) {
      try {
        const template = await this.createDefaultTemplate(templateId);
        this.templateRegistry.set(templateId, template);
        this.logger.debug('Default template loaded', { templateId });
      } catch (error) {
        this.logger.warn('Failed to load default template', { templateId, error });
      }
    }
  }

  private async createDefaultTemplate(templateId: string): Promise<DocumentTemplate> {
    // Create basic default templates
    const [type, framework, docType] = templateId.split('-');
    
    return {
      id: templateId,
      name: `${type} ${framework} ${docType}`.replace(/\b\w/g, l => l.toUpperCase()),
      type: { category: docType as any, subtype: framework, template: templateId, customization: {} },
      structure: {
        sections: [
          { id: 'overview', title: 'Overview', order: 1, required: true, content: '', variables: [] },
          { id: 'installation', title: 'Installation', order: 2, required: true, content: '', variables: [] },
          { id: 'usage', title: 'Usage', order: 3, required: true, content: '', variables: [] }
        ],
        variables: [
          { name: 'projectName', type: 'string', required: true, default: '', description: 'Project name' },
          { name: 'version', type: 'string', required: false, default: '1.0.0', description: 'Project version' }
        ],
        styles: [],
        metadata: {
          created: new Date(),
          updated: new Date(),
          version: '1.0.0',
          author: 'system',
          description: `Default template for ${type} ${framework} ${docType}`,
          category: docType
        }
      },
      variables: [
        { name: 'projectName', type: 'string', value: '', description: 'Project name' },
        { name: 'version', type: 'string', value: '1.0.0', description: 'Project version' }
      ],
      sections: [
        {
          id: 'overview',
          title: 'Overview',
          content: '# {{projectName}}\n\nOverview of {{projectName}} version {{version}}.',
          order: 1,
          required: true
        },
        {
          id: 'installation',
          title: 'Installation',
          content: '## Installation\n\nInstallation instructions for {{projectName}}.',
          order: 2,
          required: true
        },
        {
          id: 'usage',
          title: 'Usage',
          content: '## Usage\n\nUsage examples for {{projectName}}.',
          order: 3,
          required: true
        }
      ],
      styles: [],
      validation: { rules: [], required: true, errorHandling: 'warn' },
      metadata: {
        created: new Date(),
        updated: new Date(),
        version: '1.0.0',
        author: 'system',
        description: `Default template for ${type} ${framework} ${docType}`,
        category: docType
      }
    };
  }

  async getRegisteredTemplates(): Promise<string[]> {
    return Array.from(this.templateRegistry.keys());
  }

  async getTemplateUsage(templateId: string): Promise<TemplateUsage | null> {
    // In a real implementation, this would retrieve usage statistics
    return null;
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down TemplateEngine');
    await this.cacheManager.shutdown();
    this.templateRegistry.clear();
    this.logger.info('TemplateEngine shutdown completed');
  }
}

// Implementation classes
class VariableResolverImpl implements VariableResolver {
  async resolve(variable: any, context: RenderContext): Promise<any> {
    // Check context variables first
    if (context.variables && context.variables[variable.name] !== undefined) {
      return context.variables[variable.name];
    }

    // Use default value
    if (variable.value !== undefined) {
      return variable.value;
    }

    // Use type-specific defaults
    switch (variable.type) {
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return null;
    }
  }
}

class SectionGeneratorImpl implements SectionGenerator {
  private handlebars = Handlebars.create();

  async generate(section: any, variables: Record<string, any>, context: RenderContext): Promise<GeneratedSection> {
    const template = this.handlebars.compile(section.content);
    const content = template(variables);

    return {
      id: section.id,
      title: section.title,
      content,
      order: section.order,
      metadata: {
        generated: new Date(),
        variables: Object.keys(variables),
        contentLength: content.length
      }
    };
  }
}

class StyleApplicatorImpl implements StyleApplicator {
  async apply(content: string, styles: StyleDefinition[]): Promise<StyledContent> {
    // Basic style application - in a real implementation, this would be more sophisticated
    let styledContent = content;

    // Apply CSS classes or inline styles based on selectors
    for (const style of styles) {
      // This is a simplified implementation
      if (style.selector.startsWith('.')) {
        const className = style.selector.substring(1);
        styledContent = styledContent.replace(
          new RegExp(`<([^>]+)class="([^"]*)"`, 'g'),
          `<$1class="$2 ${className}"`
        );
      }
    }

    return {
      content: styledContent,
      appliedStyles: styles.length,
      assets: []
    };
  }
}

// Supporting interfaces
interface TemplateRegistry extends Map<string, DocumentTemplate> {}

interface VariableResolver {
  resolve(variable: any, context: RenderContext): Promise<any>;
}

interface SectionGenerator {
  generate(section: any, variables: Record<string, any>, context: RenderContext): Promise<GeneratedSection>;
}

interface StyleApplicator {
  apply(content: string, styles: StyleDefinition[]): Promise<StyledContent>;
}

interface RenderContext {
  variables?: Record<string, any>;
  target?: any;
  specifications?: any;
  language?: string;
  audience?: string;
}

interface RenderedContent {
  content: string;
  metadata: {
    templateId: string;
    rendered: Date;
    variables: Record<string, any>;
    sections: number;
    processingTime?: number;
    validation?: boolean;
  };
  sections: GeneratedSection[];
  assets: any[];
}

interface GeneratedSection {
  id: string;
  title: string;
  content: string;
  order: number;
  metadata: {
    generated: Date;
    variables: string[];
    contentLength: number;
  };
}

interface StyleDefinition {
  selector: string;
  properties: Record<string, string>;
}

interface StyledContent {
  content: string;
  appliedStyles: number;
  assets: any[];
}

interface ResolvedTemplate extends DocumentTemplate {
  resolvedVariables: Record<string, any>;
}

interface RenderValidation {
  passed: boolean;
  errors: string[];
  warnings: string[];
  validatedAt: Date;
  contentLength: number;
}

interface TemplateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedAt: Date;
  templateId: string;
}

interface OptimizedTemplate extends DocumentTemplate {
  optimization: {
    appliedAt: Date;
    originalTemplateId: string;
    usageMetrics: TemplateUsage;
    optimizations: string[];
    compiledSections?: Record<string, any>;
  };
}

interface TemplateUsage {
  templateId: string;
  usageCount: number;
  lastUsed: Date;
  averageRenderTime: number;
  sectionUsage: Record<string, { usage: number; lastUsed: Date }>;
  variableUsage: Record<string, { usage: number; lastUsed: Date }>;
  styleUsage: Record<string, { usage: number; lastUsed: Date }>;
}

interface CustomizedTemplate extends DocumentTemplate {
  customization: TemplateCustomization;
  metadata: any;
}