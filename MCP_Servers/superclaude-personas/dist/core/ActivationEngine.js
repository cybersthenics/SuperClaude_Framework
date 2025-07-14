import { PERSONA_NAMES } from '../types';
export class ActivationEngine {
    logger;
    cache;
    keywordMatchers = {
        architect: ["architecture", "design", "scalability", "system", "structure", "patterns", "long-term"],
        frontend: ["component", "responsive", "accessibility", "ui", "ux", "user", "interface", "css", "react", "vue"],
        backend: ["api", "database", "service", "reliability", "server", "endpoint", "data", "performance"],
        analyzer: ["analyze", "investigate", "root cause", "debug", "troubleshoot", "examine", "inspect"],
        security: ["vulnerability", "threat", "compliance", "secure", "authentication", "authorization", "encrypt"],
        performance: ["optimize", "performance", "bottleneck", "speed", "slow", "memory", "cpu", "benchmark"],
        qa: ["test", "quality", "validation", "edge case", "coverage", "regression", "bug", "defect"],
        refactorer: ["refactor", "cleanup", "technical debt", "maintainability", "simplify", "improve"],
        devops: ["deploy", "infrastructure", "ci/cd", "docker", "kubernetes", "monitoring", "automation"],
        mentor: ["explain", "learn", "understand", "guide", "teach", "documentation", "help", "tutorial"],
        scribe: ["document", "write", "guide", "readme", "wiki", "manual", "instructions", "content"]
    };
    contextPatterns = {
        frontend: ["*.tsx", "*.jsx", "*.vue", "*.css", "*.scss", "components/", "pages/", "styles/"],
        backend: ["*.py", "*.java", "*.go", "*.js", "*.ts", "api/", "models/", "controllers/", "services/"],
        infrastructure: ["Dockerfile", "*.yml", "*.yaml", ".github/", "terraform/", "k8s/", "docker-compose"],
        security: ["*auth*", "*security*", "*.pem", "*.key", "middleware/", "guards/"],
        documentation: ["*.md", "*.rst", "*.txt", "docs/", "README*", "CHANGELOG*", "wiki/"],
        testing: ["*.test.*", "*.spec.*", "test/", "tests/", "__tests__/", "e2e/", "integration/"]
    };
    combinationRules = [
        {
            rule: "performance_frontend",
            personas: ["performance", "frontend"],
            conditions: ["performance issues", "ui slow", "render performance"],
            weight: 0.8
        },
        {
            rule: "security_backend",
            personas: ["security", "backend"],
            conditions: ["api security", "authentication", "data protection"],
            weight: 0.9
        },
        {
            rule: "architect_analyzer",
            personas: ["architect", "analyzer"],
            conditions: ["system design", "architecture analysis", "structural issues"],
            weight: 0.7
        },
        {
            rule: "qa_frontend",
            personas: ["qa", "frontend"],
            conditions: ["ui testing", "user experience", "accessibility testing"],
            weight: 0.6
        },
        {
            rule: "devops_security",
            personas: ["devops", "security"],
            conditions: ["secure deployment", "infrastructure security", "compliance"],
            weight: 0.8
        }
    ];
    constructor(logger, cache) {
        this.logger = logger;
        this.cache = cache;
    }
    async analyzeContext(context) {
        try {
            this.logger.debug('Analyzing context for persona activation', {
                command: context.command,
                content: context.content.substring(0, 100)
            });
            const cacheKey = `analysis:${this.hashContext(context)}`;
            const cached = this.cache.get(cacheKey);
            if (cached) {
                this.logger.debug('Returning cached analysis');
                return cached;
            }
            const primaryDomain = this.detectPrimaryDomain(context);
            const complexity = this.assessComplexity(context);
            const userIntent = this.extractUserIntent(context);
            const collaborationOpportunities = this.identifyCollaborationOpportunities(context);
            const confidenceScores = await this.calculatePersonaScores(context);
            const recommendedPersonas = confidenceScores
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, 3)
                .map(score => score.persona);
            const analysis = {
                primaryDomain,
                complexity,
                userIntent,
                collaborationOpportunities,
                recommendedPersonas,
                confidenceScores
            };
            this.cache.set(cacheKey, analysis, 300);
            this.logger.info('Context analysis completed', {
                primaryDomain,
                complexity,
                topPersona: recommendedPersonas[0]
            });
            return analysis;
        }
        catch (error) {
            this.logger.error('Context analysis failed:', error);
            throw error;
        }
    }
    async calculatePersonaScores(context) {
        try {
            const scores = [];
            for (const persona of PERSONA_NAMES) {
                const score = await this.calculatePersonaScore(context, persona);
                scores.push(score);
            }
            return scores.sort((a, b) => b.totalScore - a.totalScore);
        }
        catch (error) {
            this.logger.error('Persona score calculation failed:', error);
            throw error;
        }
    }
    async calculatePersonaScore(context, persona) {
        try {
            const keywordScore = this.calculateKeywordMatch(context.content, persona) * 0.3;
            const contextScore = this.calculateContextMatch(context, persona) * 0.4;
            const historyScore = this.calculateHistoryMatch(context.userHistory, persona) * 0.2;
            const performanceScore = this.calculatePerformanceMatch(context.systemState, persona) * 0.1;
            const totalScore = keywordScore + contextScore + historyScore + performanceScore;
            const confidence = this.calculateConfidence(keywordScore, contextScore, historyScore, performanceScore);
            return {
                persona,
                totalScore,
                confidence,
                breakdown: {
                    keywordScore,
                    contextScore,
                    historyScore,
                    performanceScore
                }
            };
        }
        catch (error) {
            this.logger.error(`Score calculation failed for persona ${persona}:`, error);
            throw error;
        }
    }
    async determineAutoActivation(analysis, confidenceThreshold = 0.7) {
        try {
            const topPersona = analysis.recommendedPersonas[0];
            const topScore = analysis.confidenceScores.find(s => s.persona === topPersona);
            if (!topScore) {
                throw new Error('No persona scores available');
            }
            const shouldActivate = topScore.confidence >= confidenceThreshold;
            const decision = {
                persona: topPersona,
                confidence: topScore.confidence,
                reasoning: this.generateActivationReasoning(topScore, analysis),
                autoActivated: shouldActivate,
                overrideFlags: this.suggestOverrideFlags(analysis)
            };
            this.logger.info('Auto-activation decision made', {
                persona: topPersona,
                confidence: topScore.confidence,
                activated: shouldActivate
            });
            return decision;
        }
        catch (error) {
            this.logger.error('Auto-activation decision failed:', error);
            throw error;
        }
    }
    async validateActivationDecision(decision, context) {
        try {
            const issues = [];
            const recommendations = [];
            if (decision.confidence < 0.5) {
                issues.push('Low confidence score for persona activation');
                recommendations.push('Consider manual persona selection');
            }
            const conflictingDomains = this.checkDomainConflicts(decision.persona, context);
            if (conflictingDomains.length > 0) {
                issues.push(`Potential domain conflicts: ${conflictingDomains.join(', ')}`);
                recommendations.push('Consider multi-persona collaboration');
            }
            const resourceCheck = this.checkResourceRequirements(decision.persona, context);
            if (!resourceCheck.sufficient) {
                issues.push('Insufficient resources for persona activation');
                recommendations.push('Reduce operation scope or enable resource optimization');
            }
            const collaborationOpportunities = this.identifyCollaborationOpportunities(context);
            if (collaborationOpportunities.length > 1) {
                recommendations.push('Consider multi-persona coordination for better results');
            }
            return {
                isValid: issues.length === 0,
                issues,
                recommendations
            };
        }
        catch (error) {
            this.logger.error('Activation decision validation failed:', error);
            throw error;
        }
    }
    detectPrimaryDomain(context) {
        const content = context.content.toLowerCase();
        const command = context.command.toLowerCase();
        if (context.projectContext) {
            const framework = context.projectContext.framework?.toLowerCase();
            const language = context.projectContext.language?.toLowerCase();
            if (framework && ['react', 'vue', 'angular'].includes(framework)) {
                return 'frontend';
            }
            if (language && ['python', 'java', 'go', 'rust'].includes(language)) {
                return 'backend';
            }
        }
        if (command.includes('analyze') || command.includes('debug')) {
            return 'analysis';
        }
        if (command.includes('deploy') || command.includes('build')) {
            return 'infrastructure';
        }
        for (const [domain, patterns] of Object.entries(this.contextPatterns)) {
            if (patterns.some(pattern => content.includes(pattern.toLowerCase()))) {
                return domain;
            }
        }
        return 'analysis';
    }
    assessComplexity(context) {
        let complexity = 0.5;
        if (context.command.includes('analyze') || context.command.includes('troubleshoot')) {
            complexity += 0.2;
        }
        const complexityIndicators = [
            'architecture', 'system', 'performance', 'security', 'scale',
            'optimization', 'refactor', 'migration', 'integration'
        ];
        const matches = complexityIndicators.filter(indicator => context.content.toLowerCase().includes(indicator));
        complexity += matches.length * 0.1;
        if (context.flags.includes('--think') || context.flags.includes('--analyze')) {
            complexity += 0.1;
        }
        if (context.flags.includes('--think-hard') || context.flags.includes('--comprehensive')) {
            complexity += 0.2;
        }
        if (context.flags.includes('--ultrathink') || context.flags.includes('--enterprise')) {
            complexity += 0.3;
        }
        return Math.min(complexity, 1.0);
    }
    extractUserIntent(context) {
        const content = context.content.toLowerCase();
        const intentPatterns = {
            'create': ['create', 'build', 'implement', 'develop', 'generate'],
            'analyze': ['analyze', 'review', 'examine', 'investigate', 'understand'],
            'fix': ['fix', 'resolve', 'solve', 'debug', 'troubleshoot'],
            'optimize': ['optimize', 'improve', 'enhance', 'refactor', 'cleanup'],
            'test': ['test', 'validate', 'verify', 'check', 'ensure'],
            'document': ['document', 'write', 'explain', 'describe', 'guide']
        };
        for (const [intent, patterns] of Object.entries(intentPatterns)) {
            if (patterns.some(pattern => content.includes(pattern))) {
                return intent;
            }
        }
        return 'general';
    }
    identifyCollaborationOpportunities(context) {
        const opportunities = [];
        const content = context.content.toLowerCase();
        const domainMatches = Object.entries(this.contextPatterns).filter(([_, patterns]) => patterns.some(pattern => content.includes(pattern.toLowerCase())));
        if (domainMatches.length > 1) {
            opportunities.push('multi-domain');
        }
        for (const rule of this.combinationRules) {
            if (rule.conditions.some(condition => content.includes(condition))) {
                opportunities.push(rule.rule);
            }
        }
        return opportunities;
    }
    calculateKeywordMatch(content, persona) {
        const keywords = this.keywordMatchers[persona];
        const contentLower = content.toLowerCase();
        let matches = 0;
        let totalWeight = 0;
        for (const keyword of keywords) {
            const weight = keyword.length > 6 ? 2 : 1;
            totalWeight += weight;
            if (contentLower.includes(keyword)) {
                matches += weight;
            }
        }
        return totalWeight > 0 ? matches / totalWeight : 0;
    }
    calculateContextMatch(context, persona) {
        let score = 0;
        if (context.projectContext) {
            const framework = context.projectContext.framework?.toLowerCase();
            const language = context.projectContext.language?.toLowerCase();
            if (persona === 'frontend' && framework && ['react', 'vue', 'angular'].includes(framework)) {
                score += 0.4;
            }
            if (persona === 'backend' && language && ['python', 'java', 'go', 'rust'].includes(language)) {
                score += 0.4;
            }
            if (persona === 'devops' && context.projectContext.environment === 'production') {
                score += 0.3;
            }
        }
        const commandPersonaMap = {
            'analyze': ['analyzer', 'architect'],
            'build': ['architect', 'devops'],
            'test': ['qa', 'performance'],
            'deploy': ['devops', 'security'],
            'document': ['scribe', 'mentor'],
            'optimize': ['performance', 'refactorer']
        };
        for (const [command, personas] of Object.entries(commandPersonaMap)) {
            if (context.command.includes(command) && personas.includes(persona)) {
                score += 0.3;
            }
        }
        return Math.min(score, 1.0);
    }
    calculateHistoryMatch(history, persona) {
        if (!history || !history.personaPreferences) {
            return 0.5;
        }
        const preference = history.personaPreferences.find(p => p.persona === persona);
        if (!preference) {
            return 0.5;
        }
        const ageInDays = (Date.now() - preference.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        const ageWeight = Math.max(0, 1 - ageInDays / 30);
        return preference.preference * ageWeight;
    }
    calculatePerformanceMatch(systemState, persona) {
        if (!systemState || !systemState.performance) {
            return 0.5;
        }
        const performance = systemState.performance;
        if (persona === 'performance') {
            if (performance.responseTime > 1000 || performance.cpuUsage > 80 || performance.memoryUsage > 80) {
                return 0.9;
            }
        }
        if (persona === 'security' && performance.errorRate > 0.05) {
            return 0.8;
        }
        return 0.5;
    }
    calculateConfidence(keywordScore, contextScore, historyScore, performanceScore) {
        const weights = [0.3, 0.4, 0.2, 0.1];
        const scores = [keywordScore, contextScore, historyScore, performanceScore];
        const weightedSum = scores.reduce((sum, score, index) => sum + score * weights[index], 0);
        let confidence = weightedSum;
        if (keywordScore > 0.8 && contextScore > 0.6) {
            confidence += 0.1;
        }
        if (historyScore > 0.8) {
            confidence += 0.05;
        }
        return Math.min(confidence, 1.0);
    }
    generateActivationReasoning(score, analysis) {
        const reasons = [];
        if (score.breakdown.keywordScore > 0.7) {
            reasons.push('Strong keyword match');
        }
        if (score.breakdown.contextScore > 0.7) {
            reasons.push('Excellent context alignment');
        }
        if (score.breakdown.historyScore > 0.7) {
            reasons.push('Matches user preferences');
        }
        if (analysis.complexity > 0.7) {
            reasons.push('High complexity task');
        }
        return reasons.join(', ') || 'General suitability';
    }
    suggestOverrideFlags(analysis) {
        const flags = [];
        if (analysis.complexity > 0.8) {
            flags.push('--think-hard');
        }
        if (analysis.collaborationOpportunities.length > 1) {
            flags.push('--multi-persona');
        }
        if (analysis.primaryDomain === 'frontend') {
            flags.push('--magic');
        }
        if (analysis.primaryDomain === 'analysis') {
            flags.push('--seq');
        }
        return flags;
    }
    checkDomainConflicts(persona, context) {
        const conflicts = [];
        if (persona === 'frontend' && context.projectContext?.language === 'python') {
            conflicts.push('backend-language');
        }
        if (persona === 'security' && context.command.includes('ui')) {
            conflicts.push('ui-security-mismatch');
        }
        return conflicts;
    }
    checkResourceRequirements(persona, context) {
        const required = [];
        const resourceMap = {
            performance: ['high-cpu', 'benchmarking-tools'],
            security: ['security-scanners', 'compliance-tools'],
            architect: ['modeling-tools', 'analysis-frameworks'],
            analyzer: ['debugging-tools', 'log-analysis'],
            qa: ['testing-frameworks', 'coverage-tools'],
            devops: ['deployment-tools', 'monitoring'],
            frontend: ['ui-frameworks', 'design-tools'],
            backend: ['database-tools', 'api-frameworks'],
            refactorer: ['code-analysis', 'refactoring-tools'],
            mentor: ['documentation-tools', 'example-libraries'],
            scribe: ['writing-tools', 'localization']
        };
        required.push(...(resourceMap[persona] || []));
        return { sufficient: true, required };
    }
    hashContext(context) {
        const hash = Buffer.from(JSON.stringify({
            command: context.command,
            content: context.content.substring(0, 200),
            flags: context.flags
        })).toString('base64');
        return hash.substring(0, 16);
    }
}
//# sourceMappingURL=ActivationEngine.js.map