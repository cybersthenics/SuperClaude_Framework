#!/usr/bin/env python3
"""
SuperClaude PrePrompt Hook
Enhances prompts with context and personalization before processing
"""

import json
import sys
import os
from typing import Dict, Any, Optional
from dataclasses import dataclass
import time

@dataclass
class PrePromptResult:
    """Result of pre-prompt processing"""
    enhanced_prompt: str
    context_added: Dict[str, Any]
    personalization_applied: Dict[str, Any]
    processing_time: float
    recommendations: Optional[Dict[str, Any]] = None

class PrePromptHook:
    """PrePrompt hook for context enhancement and personalization"""
    
    def __init__(self):
        self.bridge_url = os.environ.get('BRIDGE_HOOKS_URL', 'http://localhost:8080')
        self.timeout = float(os.environ.get('HOOK_TIMEOUT_MS', '500')) / 1000
        self.enable_context_enhancement = os.environ.get('ENABLE_CONTEXT_ENHANCEMENT', 'true').lower() == 'true'
        self.enable_personalization = os.environ.get('ENABLE_PERSONALIZATION', 'true').lower() == 'true'
    
    def process_prompt(self, context: Dict[str, Any]) -> PrePromptResult:
        """Process prompt with context enhancement and personalization"""
        start_time = time.time()
        
        prompt = context.get('prompt', '')
        user_context = context.get('context', {})
        user_preferences = context.get('user_preferences', {})
        
        # Initialize results
        enhanced_prompt = prompt
        context_added = {}
        personalization_applied = {}
        
        # Context enhancement
        if self.enable_context_enhancement:
            context_result = self.enhance_context(prompt, user_context)
            enhanced_prompt = context_result['enhanced_prompt']
            context_added = context_result['context_added']
        
        # Personalization
        if self.enable_personalization:
            personalization_result = self.apply_personalization(enhanced_prompt, user_preferences)
            enhanced_prompt = personalization_result['personalized_prompt']
            personalization_applied = personalization_result['personalization_applied']
        
        # Generate recommendations
        recommendations = self.generate_recommendations(context, enhanced_prompt)
        
        processing_time = time.time() - start_time
        
        return PrePromptResult(
            enhanced_prompt=enhanced_prompt,
            context_added=context_added,
            personalization_applied=personalization_applied,
            processing_time=processing_time,
            recommendations=recommendations
        )
    
    def enhance_context(self, prompt: str, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance prompt with additional context"""
        enhanced_prompt = prompt
        context_added = {}
        
        # Add file type context
        if 'file_type' in user_context:
            file_type = user_context['file_type']
            context_enhancement = f"\nContext: Working with {file_type} files."
            enhanced_prompt += context_enhancement
            context_added['file_type'] = file_type
        
        # Add complexity hints
        if 'complexity_hints' in user_context:
            hints = user_context['complexity_hints']
            if hints:
                hint_text = f"\nComplexity indicators: {', '.join(hints)}"
                enhanced_prompt += hint_text
                context_added['complexity_hints'] = hints
        
        # Add recent analysis context
        if 'recent_analysis' in user_context:
            analysis = user_context['recent_analysis']
            context_enhancement = f"\nPrevious analysis results: {analysis.get('summary', 'Available')}"
            enhanced_prompt += context_enhancement
            context_added['recent_analysis'] = True
        
        # Add project context
        if 'project_info' in user_context:
            project = user_context['project_info']
            if project.get('framework'):
                context_enhancement = f"\nProject framework: {project['framework']}"
                enhanced_prompt += context_enhancement
                context_added['framework'] = project['framework']
        
        return {
            'enhanced_prompt': enhanced_prompt,
            'context_added': context_added
        }
    
    def apply_personalization(self, prompt: str, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Apply user personalization to prompt"""
        personalized_prompt = prompt
        personalization_applied = {}
        
        # Apply persona preferences
        if 'persona' in user_preferences:
            persona = user_preferences['persona']
            persona_instruction = self.get_persona_instruction(persona)
            if persona_instruction:
                personalized_prompt = f"{persona_instruction}\n\n{personalized_prompt}"
                personalization_applied['persona'] = persona
        
        # Apply detail level preferences
        if 'detail_level' in user_preferences:
            detail_level = user_preferences['detail_level']
            detail_instruction = self.get_detail_instruction(detail_level)
            if detail_instruction:
                personalized_prompt += f"\n\n{detail_instruction}"
                personalization_applied['detail_level'] = detail_level
        
        # Apply focus area preferences
        if 'focus_areas' in user_preferences:
            focus_areas = user_preferences['focus_areas']
            if focus_areas:
                focus_instruction = f"\nFocus particularly on: {', '.join(focus_areas)}"
                personalized_prompt += focus_instruction
                personalization_applied['focus_areas'] = focus_areas
        
        # Apply output format preferences
        if 'output_format' in user_preferences:
            output_format = user_preferences['output_format']
            format_instruction = self.get_format_instruction(output_format)
            if format_instruction:
                personalized_prompt += f"\n\n{format_instruction}"
                personalization_applied['output_format'] = output_format
        
        return {
            'personalized_prompt': personalized_prompt,
            'personalization_applied': personalization_applied
        }
    
    def get_persona_instruction(self, persona: str) -> str:
        """Get persona-specific instruction"""
        persona_instructions = {
            'security': 'Analyze from a security perspective, focusing on vulnerabilities, threat vectors, and security best practices.',
            'performance': 'Focus on performance optimization, bottlenecks, resource usage, and efficiency improvements.',
            'architect': 'Take a systems architecture approach, considering scalability, maintainability, and design patterns.',
            'frontend': 'Emphasize user experience, accessibility, responsive design, and modern frontend practices.',
            'backend': 'Focus on server-side concerns, API design, data integrity, and system reliability.',
            'qa': 'Approach from a quality assurance perspective, focusing on testing, edge cases, and quality gates.',
            'mentor': 'Provide educational explanations with clear reasoning and learning opportunities.'
        }
        return persona_instructions.get(persona, '')
    
    def get_detail_instruction(self, detail_level: str) -> str:
        """Get detail level instruction"""
        detail_instructions = {
            'brief': 'Provide a concise, high-level summary.',
            'standard': 'Provide a balanced level of detail with key points and explanations.',
            'comprehensive': 'Provide thorough, detailed analysis with examples and comprehensive coverage.',
            'expert': 'Provide expert-level detail with advanced concepts and implementation specifics.'
        }
        return detail_instructions.get(detail_level, '')
    
    def get_format_instruction(self, output_format: str) -> str:
        """Get output format instruction"""
        format_instructions = {
            'markdown': 'Format the response using markdown with proper headers, lists, and code blocks.',
            'json': 'Structure the response as valid JSON with clear object hierarchy.',
            'code': 'Focus on code examples and implementation details.',
            'documentation': 'Format as technical documentation with clear sections and examples.',
            'checklist': 'Provide actionable items in checklist format.'
        }
        return format_instructions.get(output_format, '')
    
    def generate_recommendations(self, context: Dict[str, Any], enhanced_prompt: str) -> Dict[str, Any]:
        """Generate optimization recommendations"""
        recommendations = {
            'context_optimization': [],
            'personalization_suggestions': [],
            'prompt_improvements': []
        }
        
        # Context optimization recommendations
        if 'file_type' not in context.get('context', {}):
            recommendations['context_optimization'].append('Consider adding file type context for better analysis')
        
        if 'project_info' not in context.get('context', {}):
            recommendations['context_optimization'].append('Project framework information could improve recommendations')
        
        # Personalization suggestions
        if 'persona' not in context.get('user_preferences', {}):
            recommendations['personalization_suggestions'].append('Setting a persona could provide more focused analysis')
        
        if 'detail_level' not in context.get('user_preferences', {}):
            recommendations['personalization_suggestions'].append('Specify detail level for optimal response length')
        
        # Prompt improvement suggestions
        if len(enhanced_prompt) < 50:
            recommendations['prompt_improvements'].append('More detailed prompts typically yield better results')
        
        if 'analyze' in enhanced_prompt.lower() and 'focus' not in enhanced_prompt.lower():
            recommendations['prompt_improvements'].append('Consider specifying focus areas for analysis')
        
        return recommendations
    
    def format_output(self, result: PrePromptResult) -> Dict[str, Any]:
        """Format result for output"""
        return {
            'success': True,
            'hook': 'PrePrompt',
            'enhanced_prompt': result.enhanced_prompt,
            'context_added': result.context_added,
            'personalization_applied': result.personalization_applied,
            'processing_time': result.processing_time,
            'recommendations': result.recommendations,
            'metadata': {
                'context_enhancement_enabled': self.enable_context_enhancement,
                'personalization_enabled': self.enable_personalization,
                'prompt_length_before': len(result.enhanced_prompt) - len(str(result.context_added)) - len(str(result.personalization_applied)),
                'prompt_length_after': len(result.enhanced_prompt)
            }
        }

def main():
    """Main function for hook execution"""
    hook = PrePromptHook()
    
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        
        # Handle empty input
        if not input_data.strip():
            context = {
                'prompt': 'Default prompt for testing',
                'context': {},
                'user_preferences': {}
            }
        else:
            context = json.loads(input_data)
        
        # Process prompt
        result = hook.process_prompt(context)
        
        # Format and output result
        output = hook.format_output(result)
        print(json.dumps(output, indent=2))
        
        return 0
        
    except json.JSONDecodeError as e:
        error_output = {
            'success': False,
            'hook': 'PrePrompt',
            'error': f'Invalid JSON input: {e}',
            'processing_time': 0
        }
        print(json.dumps(error_output, indent=2))
        return 1
        
    except Exception as e:
        error_output = {
            'success': False,
            'hook': 'PrePrompt',
            'error': str(e),
            'processing_time': 0
        }
        print(json.dumps(error_output, indent=2))
        return 1

if __name__ == '__main__':
    sys.exit(main())