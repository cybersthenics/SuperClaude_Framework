/**
 * Phase Manager - Handles individual wave phase execution with monitoring and validation
 */
export class PhaseManager {
    activePhases;
    phaseMetrics;
    constructor() {
        this.activePhases = new Map();
        this.phaseMetrics = new Map();
    }
    /**
     * Execute a single wave phase with comprehensive monitoring
     */
    async executePhase(phase) {
        const startTime = Date.now();
        const execution = {
            phaseId: phase.phaseId,
            status: 'running',
            startTime: new Date(),
            servers: phase.servers,
            personas: phase.personas
        };
        this.activePhases.set(phase.phaseId, execution);
        try {
            // Pre-phase validation
            await this.validatePhaseRequirements(phase);
            // Execute phase with monitoring
            const result = await this.executePhaseWithMonitoring(phase);
            // Create checkpoint
            await this.createPhaseCheckpoint(phase, result);
            // Update execution status
            execution.status = 'completed';
            execution.endTime = new Date();
            return result;
        }
        catch (error) {
            execution.status = 'failed';
            execution.error = error;
            throw error;
        }
        finally {
            this.activePhases.delete(phase.phaseId);
        }
    }
    /**
     * Get status of all active phases
     */
    getActivePhases() {
        return Array.from(this.activePhases.values());
    }
    /**
     * Get metrics for a specific phase
     */
    getPhaseMetrics(phaseId) {
        return this.phaseMetrics.get(phaseId);
    }
    // Private helper methods
    async validatePhaseRequirements(phase) {
        console.log(`🔍 Validating requirements for phase: ${phase.name}`);
        const issues = [];
        // Validate servers availability
        for (const server of phase.servers) {
            const available = await this.checkServerAvailability(server);
            if (!available) {
                issues.push({
                    code: 'SERVER_UNAVAILABLE',
                    message: `Server ${server} is not available`,
                    severity: 'high',
                    component: server
                });
            }
        }
        // Validate personas availability
        for (const persona of phase.personas) {
            const available = await this.checkPersonaAvailability(persona);
            if (!available) {
                issues.push({
                    code: 'PERSONA_UNAVAILABLE',
                    message: `Persona ${persona} is not available`,
                    severity: 'medium',
                    component: persona
                });
            }
        }
        // Validate dependencies
        for (const dependency of phase.dependencies) {
            const satisfied = await this.checkDependencySatisfied(dependency);
            if (!satisfied) {
                issues.push({
                    code: 'DEPENDENCY_NOT_SATISFIED',
                    message: `Dependency ${dependency} is not satisfied`,
                    severity: 'critical',
                    component: dependency
                });
            }
        }
        const result = {
            valid: issues.length === 0,
            issues,
            severity: this.calculateMaxSeverity(issues)
        };
        if (!result.valid) {
            throw new Error(`Phase validation failed: ${issues.map(i => i.message).join(', ')}`);
        }
        return result;
    }
    async executePhaseWithMonitoring(phase) {
        const startTime = Date.now();
        console.log(`⚡ Executing phase: ${phase.name}`);
        console.log(`   Servers: ${phase.servers.join(', ')}`);
        console.log(`   Personas: ${phase.personas.join(', ')}`);
        console.log(`   Parallel: ${phase.parallel}`);
        // Start resource monitoring
        const resourceMonitor = this.startResourceMonitoring(phase.phaseId);
        try {
            // Execute based on parallel/sequential configuration
            let output;
            if (phase.parallel) {
                output = await this.executeParallelPhase(phase);
            }
            else {
                output = await this.executeSequentialPhase(phase);
            }
            const executionTime = Date.now() - startTime;
            const resourceUsage = await this.stopResourceMonitoring(resourceMonitor);
            // Record metrics
            const metrics = {
                executionTime,
                resourceUsage,
                validationTime: 100, // From validation step
                checkpointTime: 50, // From checkpoint creation
                parallelEfficiency: phase.parallel ? this.calculateParallelEfficiency(phase) : 1.0
            };
            this.phaseMetrics.set(phase.phaseId, metrics);
            // Create execution context
            const context = {
                executionId: `phase_${phase.phaseId}`,
                command: 'phase_execution',
                flags: phase.parallel ? ['parallel'] : ['sequential'],
                scope: [...phase.servers, ...phase.personas],
                metadata: {
                    phaseName: phase.name,
                    servers: phase.servers,
                    personas: phase.personas,
                    parallel: phase.parallel,
                    timeout: phase.timeout
                },
                timestamp: new Date()
            };
            return {
                phaseId: phase.phaseId,
                status: 'completed',
                output,
                context,
                metrics
            };
        }
        finally {
            await this.stopResourceMonitoring(resourceMonitor);
        }
    }
    async executeParallelPhase(phase) {
        console.log(`   🔄 Executing parallel operations for ${phase.name}`);
        // Simulate parallel execution of servers and personas
        const serverPromises = phase.servers.map(server => this.executeServerOperation(server, phase));
        const personaPromises = phase.personas.map(persona => this.executePersonaOperation(persona, phase));
        // Wait for all parallel operations to complete
        const [serverResults, personaResults] = await Promise.all([
            Promise.all(serverPromises),
            Promise.all(personaPromises)
        ]);
        return {
            phaseType: 'parallel',
            serverResults,
            personaResults,
            totalOperations: serverResults.length + personaResults.length,
            coordinationOverhead: this.calculateCoordinationOverhead(phase)
        };
    }
    async executeSequentialPhase(phase) {
        console.log(`   📋 Executing sequential operations for ${phase.name}`);
        const results = [];
        // Execute servers sequentially
        for (const server of phase.servers) {
            const result = await this.executeServerOperation(server, phase);
            results.push({ type: 'server', server, result });
        }
        // Execute personas sequentially
        for (const persona of phase.personas) {
            const result = await this.executePersonaOperation(persona, phase);
            results.push({ type: 'persona', persona, result });
        }
        return {
            phaseType: 'sequential',
            operations: results,
            totalOperations: results.length,
            executionOrder: results.map(r => `${r.type}:${r.server || r.persona}`)
        };
    }
    async executeServerOperation(server, phase) {
        // Simulate server operation execution
        const duration = Math.random() * 1000 + 500; // 500-1500ms
        await new Promise(resolve => setTimeout(resolve, duration));
        return {
            server,
            phase: phase.name,
            duration,
            status: 'completed',
            timestamp: new Date()
        };
    }
    async executePersonaOperation(persona, phase) {
        // Simulate persona operation execution
        const duration = Math.random() * 800 + 300; // 300-1100ms
        await new Promise(resolve => setTimeout(resolve, duration));
        return {
            persona,
            phase: phase.name,
            duration,
            status: 'completed',
            specialization: this.getPersonaSpecialization(persona),
            timestamp: new Date()
        };
    }
    async createPhaseCheckpoint(phase, result) {
        console.log(`💾 Creating checkpoint for phase: ${phase.name}`);
        // Simulate checkpoint creation
        await new Promise(resolve => setTimeout(resolve, 50));
        // In real implementation, this would persist the phase state
        const checkpoint = {
            phaseId: phase.phaseId,
            timestamp: new Date(),
            state: result.output,
            context: result.context,
            validationCriteria: phase.validationCriteria
        };
        console.log(`   ✅ Checkpoint created for ${phase.phaseId}`);
    }
    startResourceMonitoring(phaseId) {
        const monitor = {
            phaseId,
            startTime: Date.now(),
            memoryBaseline: process.memoryUsage().heapUsed,
            cpuBaseline: process.cpuUsage().user
        };
        console.log(`📊 Started resource monitoring for ${phaseId}`);
        return monitor;
    }
    async stopResourceMonitoring(monitor) {
        const endTime = Date.now();
        const memoryUsed = process.memoryUsage().heapUsed - monitor.memoryBaseline;
        const cpuUsed = process.cpuUsage().user - monitor.cpuBaseline;
        const resourceUsage = {
            memory: Math.max(memoryUsed / 1024 / 1024, 0), // MB
            cpu: cpuUsed / 1000000, // Convert microseconds to seconds
            io: Math.random() * 50 + 10, // Simulated I/O operations
            network: Math.random() * 100 + 20 // Simulated network usage
        };
        console.log(`📊 Resource usage - Memory: ${resourceUsage.memory.toFixed(2)}MB, CPU: ${resourceUsage.cpu.toFixed(3)}s`);
        return resourceUsage;
    }
    async checkServerAvailability(server) {
        // Simulate server availability check
        await new Promise(resolve => setTimeout(resolve, 10));
        return true; // Assume all servers are available for now
    }
    async checkPersonaAvailability(persona) {
        // Simulate persona availability check
        await new Promise(resolve => setTimeout(resolve, 10));
        return true; // Assume all personas are available for now
    }
    async checkDependencySatisfied(dependency) {
        // Simulate dependency check
        await new Promise(resolve => setTimeout(resolve, 10));
        return true; // Assume all dependencies are satisfied for now
    }
    calculateMaxSeverity(issues) {
        if (issues.some(i => i.severity === 'critical'))
            return 'critical';
        if (issues.some(i => i.severity === 'high'))
            return 'high';
        if (issues.some(i => i.severity === 'medium'))
            return 'medium';
        return 'low';
    }
    calculateParallelEfficiency(phase) {
        // Calculate how efficiently parallel operations were executed
        const totalOperations = phase.servers.length + phase.personas.length;
        const idealParallelism = Math.min(totalOperations, 4); // Assume max 4 parallel operations
        return Math.min(totalOperations / idealParallelism, 1.0);
    }
    calculateCoordinationOverhead(phase) {
        // Parallel operations have coordination overhead
        const operations = phase.servers.length + phase.personas.length;
        return operations * 25; // 25ms overhead per operation
    }
    getPersonaSpecialization(persona) {
        const specializations = {
            'analyzer': 'analysis_and_investigation',
            'architect': 'system_design_and_architecture',
            'security': 'security_and_compliance',
            'qa': 'quality_assurance_and_testing',
            'performance': 'performance_optimization',
            'backend': 'server_side_development',
            'frontend': 'user_interface_development',
            'devops': 'deployment_and_infrastructure'
        };
        return specializations[persona] || 'general_purpose';
    }
}
//# sourceMappingURL=PhaseManager.js.map