#!/usr/bin/env python3
"""
SuperClaude PreCompact Hook
Executes before context compaction - handles context optimization and critical data preservation
"""

import json
import sys
import os
import requests
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime
import time
import hashlib

# Import performance optimizer
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from performance_optimizer import (
    timed_operation, cached_operation, monitor
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/anton/SuperClaude_MCP/logs/hooks.log'),
        logging.StreamHandler(sys.stderr)
    ]
)
logger = logging.getLogger('precompact_hook')

class PreCompactHook:
    def __init__(self):
        self.bridge_url = os.environ.get('BRIDGE_HOOKS_URL', 'http://localhost:8080')
        self.timeout = float(os.environ.get('HOOK_TIMEOUT_MS', '300')) / 1000  # Extended for context analysis
        
    def extract_context_info(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract context information for optimization analysis"""
        
        context_data = input_data.get('context', {})
        session_data = input_data.get('session', {})
        
        context = {
            'sessionId': session_data.get('id', os.environ.get('CLAUDE_SESSION_ID', 'default')),
            'timestamp': datetime.now().isoformat(),
            'executionId': f"precompact_{datetime.now().timestamp()}_{os.getpid()}",
            'context': {
                'currentSize': context_data.get('size', 0),
                'tokenCount': context_data.get('tokens', 0),
                'messageCount': context_data.get('messageCount', 0),
                'compactionThreshold': context_data.get('threshold', 0.8),
                'preservationStrategy': context_data.get('strategy', 'intelligent'),
                'criticalContextTypes': context_data.get('criticalTypes', [])
            },
            'session': {
                'duration': session_data.get('duration', 0),
                'toolUsageCount': session_data.get('toolUsage', 0),
                'activePersonas': session_data.get('personas', []),
                'mcpServersUsed': session_data.get('mcpServers', []),
                'complexityProfile': session_data.get('complexity', 'moderate')
            },
            'analysis': {
                'contextPattern': self.analyze_context_patterns(context_data),
                'preservationPriorities': self.determine_preservation_priorities(context_data, session_data),
                'optimizationOpportunities': self.identify_optimization_opportunities(context_data),
                'criticalDataMap': self.map_critical_data(context_data)
            }
        }
        
        return context
    
    def analyze_context_patterns(self, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze patterns in the context for intelligent preservation"""
        patterns = {
            'repeatedQueries': [],
            'commandSequences': [],
            'domainFocusAreas': [],
            'taskContinuity': [],
            'referencedResources': []
        }
        
        try:
            # Extract messages for pattern analysis
            messages = context_data.get('messages', [])
            
            # Analyze command patterns
            commands_used = []
            for message in messages[-20:]:  # Last 20 messages for patterns
                content = message.get('content', '').lower()
                if content.startswith('/'):
                    command = content.split()[0]
                    commands_used.append(command)
            
            # Find repeated command sequences
            if len(commands_used) >= 3:
                for i in range(len(commands_used) - 2):
                    sequence = commands_used[i:i+3]
                    if commands_used.count(sequence[0]) > 1:
                        patterns['commandSequences'].append(' → '.join(sequence))
            
            # Analyze domain focus
            domain_keywords = {
                'frontend': ['component', 'react', 'vue', 'css', 'ui', 'accessibility'],
                'backend': ['api', 'database', 'server', 'endpoint', 'service'],
                'security': ['auth', 'vulnerability', 'security', 'encryption'],
                'performance': ['optimize', 'performance', 'speed', 'memory', 'cache'],
                'quality': ['test', 'quality', 'validation', 'lint', 'review']
            }
            
            domain_scores = {}
            for message in messages[-10:]:  # Last 10 messages
                content = message.get('content', '').lower()
                for domain, keywords in domain_keywords.items():
                    score = sum(1 for keyword in keywords if keyword in content)
                    domain_scores[domain] = domain_scores.get(domain, 0) + score
            
            # Get top domains
            if domain_scores:
                sorted_domains = sorted(domain_scores.items(), key=lambda x: x[1], reverse=True)
                patterns['domainFocusAreas'] = [domain for domain, score in sorted_domains[:3] if score > 0]
            
            # Look for task continuity indicators
            task_indicators = ['continue', 'next', 'also', 'additionally', 'furthermore', 'build on']
            for message in messages[-5:]:
                content = message.get('content', '').lower()
                if any(indicator in content for indicator in task_indicators):
                    patterns['taskContinuity'].append(content[:100] + '...' if len(content) > 100 else content)
            
            # Find referenced resources (files, URLs, etc.)
            import re
            resource_patterns = [
                r'[\w\-_]+\.(js|ts|py|md|json|yml|yaml)',  # File extensions
                r'https?://[^\s]+',  # URLs
                r'@[\w\-_]+',  # References
                r'/[\w\-_/]+',  # Paths
            ]
            
            for message in messages[-10:]:
                content = message.get('content', '')
                for pattern in resource_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    patterns['referencedResources'].extend(matches[:5])  # Limit per message
            
            # Remove duplicates and limit
            patterns['referencedResources'] = list(set(patterns['referencedResources']))[:20]
            
        except Exception as e:
            logger.warning(f"Context pattern analysis failed: {e}")
            
        return patterns
    
    def determine_preservation_priorities(self, context_data: Dict[str, Any], session_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Determine what context should be preserved with highest priority"""
        priorities = []
        
        # High priority: Recent tool executions and results
        priorities.append({
            'type': 'recent_tool_results',
            'priority': 'critical',
            'reason': 'Recent tool results contain immediate context',
            'retention': 'preserve_fully',
            'context_window': 'last_10_messages'
        })
        
        # High priority: Active personas and their context
        active_personas = session_data.get('personas', [])
        if active_personas:
            priorities.append({
                'type': 'persona_context',
                'priority': 'high',
                'reason': f'Active personas: {", ".join(active_personas)}',
                'retention': 'preserve_key_decisions',
                'personas': active_personas
            })
        
        # Medium priority: MCP server interactions
        mcp_servers = session_data.get('mcpServers', [])
        if mcp_servers:
            priorities.append({
                'type': 'mcp_interactions',
                'priority': 'medium',
                'reason': f'Active MCP servers: {", ".join(mcp_servers)}',
                'retention': 'preserve_configurations',
                'servers': mcp_servers
            })
        
        # Medium priority: Error contexts and debugging info
        priorities.append({
            'type': 'error_debugging',
            'priority': 'medium',
            'reason': 'Error contexts help maintain debugging continuity',
            'retention': 'preserve_error_chains',
            'context_window': 'last_error_sequence'
        })
        
        # Low priority: General conversation flow
        priorities.append({
            'type': 'conversation_flow',
            'priority': 'low',
            'reason': 'Maintain conversational continuity',
            'retention': 'summarize_key_points',
            'context_window': 'session_summary'
        })
        
        # Critical: Project context and file modifications
        priorities.append({
            'type': 'project_state',
            'priority': 'critical',
            'reason': 'Project state changes must be preserved',
            'retention': 'preserve_all_changes',
            'includes': ['file_modifications', 'git_operations', 'configuration_changes']
        })
        
        return priorities
    
    def identify_optimization_opportunities(self, context_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify opportunities for context optimization"""
        opportunities = []
        
        token_count = context_data.get('tokens', 0)
        message_count = context_data.get('messageCount', 0)
        
        # Large context optimization
        if token_count > 50000:
            opportunities.append({
                'type': 'token_reduction',
                'description': f'High token count ({token_count}), aggressive summarization recommended',
                'strategy': 'aggressive_summarization',
                'expected_reduction': '40-60%'
            })
        elif token_count > 30000:
            opportunities.append({
                'type': 'token_reduction',
                'description': f'Moderate token count ({token_count}), selective summarization recommended',
                'strategy': 'selective_summarization',
                'expected_reduction': '20-40%'
            })
        
        # Message consolidation
        if message_count > 100:
            opportunities.append({
                'type': 'message_consolidation',
                'description': f'High message count ({message_count}), consolidation opportunities exist',
                'strategy': 'consolidate_related_messages',
                'expected_reduction': '15-30%'
            })
        
        # Redundant information removal
        opportunities.append({
            'type': 'redundancy_removal',
            'description': 'Remove redundant tool outputs and repeated information',
            'strategy': 'deduplication',
            'expected_reduction': '10-20%'
        })
        
        # Code block optimization
        opportunities.append({
            'type': 'code_optimization',
            'description': 'Optimize large code blocks by preserving only key sections',
            'strategy': 'code_summarization',
            'expected_reduction': '20-40%'
        })
        
        return opportunities
    
    def map_critical_data(self, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """Map critical data that must be preserved during compaction"""
        critical_map = {
            'session_state': {
                'active_tasks': [],
                'pending_operations': [],
                'error_contexts': [],
                'configuration_changes': []
            },
            'project_context': {
                'modified_files': [],
                'git_operations': [],
                'build_configurations': [],
                'dependency_changes': []
            },
            'persona_decisions': {
                'architectural_decisions': [],
                'security_considerations': [],
                'performance_optimizations': [],
                'quality_gates': []
            },
            'mcp_state': {
                'server_configurations': [],
                'cached_results': [],
                'routing_decisions': [],
                'performance_metrics': []
            }
        }
        
        try:
            # Extract critical data from messages
            messages = context_data.get('messages', [])
            
            for message in messages[-20:]:  # Focus on recent messages
                content = message.get('content', '').lower()
                message_type = message.get('type', 'user')
                
                # Identify critical patterns
                if 'error' in content or 'exception' in content:
                    critical_map['session_state']['error_contexts'].append({
                        'content': content[:200],
                        'timestamp': message.get('timestamp'),
                        'type': 'error'
                    })
                
                if message_type == 'tool_result' and ('modified' in content or 'created' in content):
                    critical_map['project_context']['modified_files'].append({
                        'operation': content[:100],
                        'timestamp': message.get('timestamp')
                    })
                
                if 'git' in content and ('commit' in content or 'push' in content):
                    critical_map['project_context']['git_operations'].append({
                        'operation': content[:100],
                        'timestamp': message.get('timestamp')
                    })
                
                # Look for architectural decisions
                if any(keyword in content for keyword in ['architecture', 'design', 'pattern', 'structure']):
                    critical_map['persona_decisions']['architectural_decisions'].append({
                        'decision': content[:150],
                        'timestamp': message.get('timestamp')
                    })
            
        except Exception as e:
            logger.warning(f"Critical data mapping failed: {e}")
        
        return critical_map
    
    @timed_operation("context_preservation")
    def generate_preservation_plan(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a plan for preserving critical context during compaction"""
        plan = {
            'preservationStrategy': context['context']['preservationStrategy'],
            'criticalDataToPreserve': context['analysis']['criticalDataMap'],
            'optimizationActions': [],
            'compressionTargets': [],
            'preservationCheckpoints': []
        }
        
        # Generate optimization actions based on opportunities
        for opportunity in context['analysis']['optimizationOpportunities']:
            plan['optimizationActions'].append({
                'action': opportunity['strategy'],
                'target': opportunity['type'],
                'expectedReduction': opportunity['expected_reduction'],
                'priority': self.get_optimization_priority(opportunity)
            })
        
        # Define compression targets based on priorities
        for priority in context['analysis']['preservationPriorities']:
            if priority['priority'] in ['critical', 'high']:
                plan['compressionTargets'].append({
                    'type': priority['type'],
                    'retention': priority['retention'],
                    'compression': 'minimal'
                })
            else:
                plan['compressionTargets'].append({
                    'type': priority['type'],
                    'retention': priority['retention'],
                    'compression': 'aggressive'
                })
        
        # Create preservation checkpoints
        plan['preservationCheckpoints'] = [
            {
                'checkpoint': 'pre_compaction_snapshot',
                'action': 'create_context_snapshot',
                'priority': 'critical'
            },
            {
                'checkpoint': 'critical_data_backup',
                'action': 'backup_critical_data_map',
                'priority': 'high'
            },
            {
                'checkpoint': 'persona_state_preservation',
                'action': 'preserve_persona_contexts',
                'priority': 'high'
            },
            {
                'checkpoint': 'mcp_state_preservation',
                'action': 'preserve_mcp_configurations',
                'priority': 'medium'
            }
        ]
        
        return plan
    
    def get_optimization_priority(self, opportunity: Dict[str, Any]) -> str:
        """Determine optimization priority based on opportunity type and impact"""
        expected_reduction = opportunity.get('expected_reduction', '0%')
        reduction_value = int(expected_reduction.split('-')[0].rstrip('%'))
        
        if reduction_value >= 40:
            return 'high'
        elif reduction_value >= 20:
            return 'medium'
        else:
            return 'low'
    
    @timed_operation("bridge_preservation_notification")
    def notify_bridge_precompaction(self, context: Dict[str, Any], plan: Dict[str, Any]) -> Dict[str, Any]:
        """Notify bridge service of impending compaction for coordination"""
        try:
            notification = {
                'event': 'pre_compaction',
                'sessionId': context['sessionId'],
                'contextInfo': context['context'],
                'preservationPlan': plan,
                'timestamp': context['timestamp']
            }
            
            start_time = time.perf_counter()
            response = requests.post(
                f'{self.bridge_url}/pre-compaction',
                json=notification,
                timeout=self.timeout
            )
            
            request_time = (time.perf_counter() - start_time) * 1000
            monitor.record_timing("precompact_bridge_request", request_time)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Bridge notified of pre-compaction for session {context['sessionId']}")
                return result
            else:
                logger.warning(f"Bridge pre-compaction notification failed: {response.status_code}")
                return self.create_fallback_response(context)
                
        except requests.Timeout:
            logger.warning("Bridge pre-compaction notification timeout")
            return self.create_fallback_response(context)
            
        except Exception as e:
            logger.error(f"Bridge pre-compaction notification error: {e}")
            return self.create_fallback_response(context)
    
    def create_fallback_response(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Create fallback response when bridge is unavailable"""
        return {
            'acknowledged': True,
            'fallback': True,
            'reason': 'Bridge service unavailable during pre-compaction',
            'localPreservation': True,
            'sessionId': context['sessionId']
        }
    
    def format_output(self, context: Dict[str, Any], plan: Dict[str, Any], bridge_response: Dict[str, Any]) -> Dict[str, Any]:
        """Format output for Claude Code"""
        return {
            'preCompactionReady': True,
            'sessionId': context['sessionId'],
            'preservationPlan': plan,
            'contextAnalysis': context['analysis'],
            'bridgeResponse': bridge_response,
            'timestamp': context['timestamp'],
            '_performance': {
                'hookDuration': plan.get('hookExecutionTime', 0),
                'preservationPlanGenerated': True,
                'bridgeNotified': bridge_response.get('acknowledged', False)
            }
        }

@timed_operation("precompact_main_execution")
def main():
    """Main entry point for PreCompact hook"""
    hook_start = time.perf_counter()
    
    try:
        # Read input from stdin
        input_text = sys.stdin.read().strip()
        input_data = json.loads(input_text) if input_text else {}
        
        # Initialize hook
        hook = PreCompactHook()
        
        # Extract context information
        context = hook.extract_context_info(input_data)
        
        logger.info(f"PreCompact hook invoked for session {context['sessionId']} "
                   f"(tokens: {context['context']['tokenCount']}, "
                   f"messages: {context['context']['messageCount']})")
        
        # Generate preservation plan
        preservation_plan = hook.generate_preservation_plan(context)
        preservation_plan['hookExecutionTime'] = (time.perf_counter() - hook_start) * 1000
        
        # Notify bridge service
        bridge_response = hook.notify_bridge_precompaction(context, preservation_plan)
        
        # Format output
        output = hook.format_output(context, preservation_plan, bridge_response)
        
        # Log pre-compaction summary
        logger.info(f"Pre-compaction analysis complete for session {context['sessionId']}. "
                   f"Optimization opportunities: {len(context['analysis']['optimizationOpportunities'])}, "
                   f"Preservation priorities: {len(context['analysis']['preservationPriorities'])}")
        
        # Write output to stdout
        print(json.dumps(output))
        
        return 0
        
    except Exception as e:
        logger.error(f"PreCompact hook error: {e}", exc_info=True)
        
        # On error, still allow compaction to proceed
        error_output = {
            'preCompactionReady': True,
            'error': str(e),
            'fallback': True,
            'timestamp': datetime.now().isoformat(),
            'preservationPlan': {
                'preservationStrategy': 'safe_default',
                'note': 'Using safe default preservation due to hook error'
            }
        }
        print(json.dumps(error_output))
        return 0

if __name__ == '__main__':
    sys.exit(main())