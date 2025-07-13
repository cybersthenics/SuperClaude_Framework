#!/usr/bin/env python3
"""
SuperClaude PostPrompt Hook
Optimizes and validates responses after prompt processing
"""

import json
import sys
import os
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import time
import re

@dataclass
class PostPromptResult:
    """Result of post-prompt processing"""
    optimized_response: str
    optimizations_applied: List[str]
    quality_metrics: Dict[str, float]
    processing_time: float
    quality_gates_passed: bool
    recommendations: Optional[Dict[str, Any]] = None

class PostPromptHook:
    """PostPrompt hook for response optimization and quality validation"""
    
    def __init__(self):
        self.bridge_url = os.environ.get('BRIDGE_HOOKS_URL', 'http://localhost:8080')
        self.timeout = float(os.environ.get('HOOK_TIMEOUT_MS', '500')) / 1000
        self.enable_optimization = os.environ.get('ENABLE_RESPONSE_OPTIMIZATION', 'true').lower() == 'true'
        self.enable_quality_gates = os.environ.get('ENABLE_QUALITY_GATES', 'true').lower() == 'true'
        self.min_quality_threshold = float(os.environ.get('MIN_QUALITY_THRESHOLD', '0.7'))
    
    def process_response(self, context: Dict[str, Any]) -> PostPromptResult:
        """Process response with optimization and quality validation"""
        start_time = time.time()
        
        response = context.get('response', '')
        optimization_hints = context.get('optimization_hints', {})
        quality_requirements = context.get('quality_requirements', {})
        
        # Initialize results
        optimized_response = response
        optimizations_applied = []
        
        # Apply optimizations
        if self.enable_optimization:
            optimization_result = self.optimize_response(optimized_response, optimization_hints)
            optimized_response = optimization_result['optimized_response']
            optimizations_applied = optimization_result['optimizations_applied']
        
        # Calculate quality metrics
        quality_metrics = self.calculate_quality_metrics(optimized_response, quality_requirements)
        
        # Check quality gates
        quality_gates_passed = self.check_quality_gates(quality_metrics, quality_requirements) if self.enable_quality_gates else True
        
        # Generate recommendations
        recommendations = self.generate_recommendations(quality_metrics, optimizations_applied, quality_gates_passed)
        
        processing_time = time.time() - start_time
        
        return PostPromptResult(
            optimized_response=optimized_response,
            optimizations_applied=optimizations_applied,
            quality_metrics=quality_metrics,
            processing_time=processing_time,
            quality_gates_passed=quality_gates_passed,
            recommendations=recommendations
        )
    
    def optimize_response(self, response: str, optimization_hints: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize response based on hints"""
        optimized_response = response
        optimizations_applied = []
        
        # Compression optimization
        if optimization_hints.get('compress', False):
            compressed_result = self.compress_response(optimized_response)
            optimized_response = compressed_result['compressed_response']
            if compressed_result['compression_applied']:
                optimizations_applied.append('compression')
        
        # Focus optimization
        if 'focus_on' in optimization_hints:
            focus_area = optimization_hints['focus_on']
            focused_result = self.focus_response(optimized_response, focus_area)
            optimized_response = focused_result['focused_response']
            if focused_result['focus_applied']:
                optimizations_applied.append(f'focus_on_{focus_area}')
        
        # Expertise level optimization
        if 'user_expertise' in optimization_hints:
            expertise_level = optimization_hints['user_expertise']
            expertise_result = self.adjust_for_expertise(optimized_response, expertise_level)
            optimized_response = expertise_result['adjusted_response']
            if expertise_result['adjustment_applied']:
                optimizations_applied.append(f'expertise_{expertise_level}')
        
        # Format optimization
        if 'output_format' in optimization_hints:
            output_format = optimization_hints['output_format']
            format_result = self.format_response(optimized_response, output_format)
            optimized_response = format_result['formatted_response']
            if format_result['formatting_applied']:
                optimizations_applied.append(f'format_{output_format}')
        
        # Actionability optimization
        if optimization_hints.get('make_actionable', False):
            actionable_result = self.make_actionable(optimized_response)
            optimized_response = actionable_result['actionable_response']
            if actionable_result['actionability_applied']:
                optimizations_applied.append('actionable')
        
        return {
            'optimized_response': optimized_response,
            'optimizations_applied': optimizations_applied
        }
    
    def compress_response(self, response: str) -> Dict[str, Any]:
        """Compress response by removing redundancy"""
        compressed_response = response
        compression_applied = False
        
        # Remove redundant phrases
        redundant_patterns = [
            r'\b(as mentioned earlier|as we discussed|as I said before)\b',
            r'\b(it is important to note that|it should be noted that|it is worth noting that)\b',
            r'\b(in other words|that is to say|in essence)\b'
        ]
        
        for pattern in redundant_patterns:
            new_response = re.sub(pattern, '', compressed_response, flags=re.IGNORECASE)
            if new_response != compressed_response:
                compressed_response = new_response
                compression_applied = True
        
        # Compress repeated information
        lines = compressed_response.split('\n')
        unique_lines = []
        seen_content = set()
        
        for line in lines:
            line_content = line.strip().lower()
            if line_content and line_content not in seen_content:
                unique_lines.append(line)
                seen_content.add(line_content)
            elif not line_content:  # Keep empty lines
                unique_lines.append(line)
        
        compressed_lines = '\n'.join(unique_lines)
        if len(compressed_lines) < len(compressed_response):
            compressed_response = compressed_lines
            compression_applied = True
        
        return {
            'compressed_response': compressed_response,
            'compression_applied': compression_applied
        }
    
    def focus_response(self, response: str, focus_area: str) -> Dict[str, Any]:
        """Focus response on specific area"""
        focused_response = response
        focus_applied = False
        
        focus_keywords = {
            'actionable_recommendations': ['recommend', 'suggest', 'should', 'action', 'implement', 'fix'],
            'security': ['security', 'vulnerability', 'authentication', 'authorization', 'encryption'],
            'performance': ['performance', 'optimization', 'speed', 'efficiency', 'bottleneck'],
            'code_quality': ['quality', 'maintainability', 'readability', 'clean', 'refactor'],
            'best_practices': ['best practice', 'convention', 'standard', 'guideline', 'pattern']
        }
        
        if focus_area in focus_keywords:
            keywords = focus_keywords[focus_area]
            
            # Extract sentences containing focus keywords
            sentences = re.split(r'[.!?]+', response)
            focused_sentences = []
            
            for sentence in sentences:
                sentence = sentence.strip()
                if any(keyword.lower() in sentence.lower() for keyword in keywords):
                    focused_sentences.append(sentence)
            
            if focused_sentences:
                focused_response = '. '.join(focused_sentences) + '.'
                focus_applied = True
        
        return {
            'focused_response': focused_response,
            'focus_applied': focus_applied
        }
    
    def adjust_for_expertise(self, response: str, expertise_level: str) -> Dict[str, Any]:
        """Adjust response for user expertise level"""
        adjusted_response = response
        adjustment_applied = False
        
        if expertise_level == 'beginner':
            # Add more explanations
            if 'because' not in response.lower() and 'explanation' not in response.lower():
                adjusted_response += '\n\nNote: These recommendations are based on software engineering best practices.'
                adjustment_applied = True
        
        elif expertise_level == 'senior':
            # Make more concise, assume knowledge
            patterns_to_remove = [
                r'\b(as you may know|as you might be aware|you probably know)\b[^.]*\.',
                r'\b(this means that|this indicates that|what this means is)\b[^.]*\.',
            ]
            
            for pattern in patterns_to_remove:
                new_response = re.sub(pattern, '', adjusted_response, flags=re.IGNORECASE)
                if new_response != adjusted_response:
                    adjusted_response = new_response
                    adjustment_applied = True
        
        elif expertise_level == 'expert':
            # Focus on advanced concepts and implementation details
            if 'implementation' not in response.lower():
                adjusted_response += '\n\nImplementation considerations should include architectural patterns and scalability factors.'
                adjustment_applied = True
        
        return {
            'adjusted_response': adjusted_response,
            'adjustment_applied': adjustment_applied
        }
    
    def format_response(self, response: str, output_format: str) -> Dict[str, Any]:
        """Format response according to specified format"""
        formatted_response = response
        formatting_applied = False
        
        if output_format == 'markdown':
            # Ensure proper markdown formatting
            if not re.search(r'^#{1,6}\s', response, re.MULTILINE):
                formatted_response = f"# Analysis Results\n\n{response}"
                formatting_applied = True
        
        elif output_format == 'json':
            # Convert to JSON structure
            try:
                json_response = {
                    'analysis': response,
                    'timestamp': time.time(),
                    'format': 'json'
                }
                formatted_response = json.dumps(json_response, indent=2)
                formatting_applied = True
            except Exception:
                pass
        
        elif output_format == 'checklist':
            # Convert to checklist format
            lines = response.split('\n')
            checklist_lines = []
            
            for line in lines:
                line = line.strip()
                if line and not line.startswith('- [ ]') and not line.startswith('- [x]'):
                    checklist_lines.append(f"- [ ] {line}")
                else:
                    checklist_lines.append(line)
            
            formatted_response = '\n'.join(checklist_lines)
            formatting_applied = True
        
        return {
            'formatted_response': formatted_response,
            'formatting_applied': formatting_applied
        }
    
    def make_actionable(self, response: str) -> Dict[str, Any]:
        """Make response more actionable"""
        actionable_response = response
        actionability_applied = False
        
        # Add action verbs if missing
        action_verbs = ['implement', 'fix', 'update', 'refactor', 'add', 'remove', 'modify']
        
        if not any(verb in response.lower() for verb in action_verbs):
            actionable_response += '\n\nRecommended actions: Review and implement the suggested improvements.'
            actionability_applied = True
        
        # Convert vague statements to specific actions
        vague_patterns = [
            (r'\bshould consider\b', 'should implement'),
            (r'\bmight want to\b', 'should'),
            (r'\bcould improve\b', 'should improve'),
            (r'\bwould be good to\b', 'should')
        ]
        
        for pattern, replacement in vague_patterns:
            new_response = re.sub(pattern, replacement, actionable_response, flags=re.IGNORECASE)
            if new_response != actionable_response:
                actionable_response = new_response
                actionability_applied = True
        
        return {
            'actionable_response': actionable_response,
            'actionability_applied': actionability_applied
        }
    
    def calculate_quality_metrics(self, response: str, quality_requirements: Dict[str, Any]) -> Dict[str, float]:
        """Calculate quality metrics for response"""
        metrics = {}
        
        # Completeness (0-1)
        word_count = len(response.split())
        expected_length = quality_requirements.get('expected_length', 100)
        metrics['completeness'] = min(word_count / expected_length, 1.0)
        
        # Clarity (0-1) - based on sentence length and structure
        sentences = re.split(r'[.!?]+', response)
        if sentences:
            avg_sentence_length = sum(len(s.split()) for s in sentences if s.strip()) / len([s for s in sentences if s.strip()])
            # Optimal sentence length is 15-20 words
            clarity_score = 1.0 - abs(avg_sentence_length - 17.5) / 17.5
            metrics['clarity'] = max(0, min(1, clarity_score))
        else:
            metrics['clarity'] = 0.0
        
        # Actionability (0-1) - presence of action words
        action_words = ['implement', 'fix', 'update', 'add', 'remove', 'modify', 'refactor', 'optimize']
        action_count = sum(1 for word in action_words if word in response.lower())
        metrics['actionability'] = min(action_count / 3, 1.0)  # 3+ action words = full score
        
        # Accuracy (0-1) - based on technical terms and specificity
        technical_terms = ['function', 'class', 'method', 'variable', 'algorithm', 'optimization', 'performance']
        technical_count = sum(1 for term in technical_terms if term in response.lower())
        metrics['accuracy'] = min(technical_count / 5, 1.0)  # 5+ technical terms = full score
        
        # Helpfulness (0-1) - based on examples and explanations
        helpful_indicators = ['example', 'because', 'reason', 'explain', 'why', 'how']
        helpful_count = sum(1 for indicator in helpful_indicators if indicator in response.lower())
        metrics['helpfulness'] = min(helpful_count / 3, 1.0)  # 3+ helpful indicators = full score
        
        return metrics
    
    def check_quality_gates(self, quality_metrics: Dict[str, float], quality_requirements: Dict[str, Any]) -> bool:
        """Check if response passes quality gates"""
        # Default thresholds
        thresholds = {
            'completeness': 0.7,
            'clarity': 0.6,
            'actionability': 0.5,
            'accuracy': 0.6,
            'helpfulness': 0.5
        }
        
        # Override with requirements
        thresholds.update(quality_requirements.get('thresholds', {}))
        
        # Check each metric
        for metric, threshold in thresholds.items():
            if metric in quality_metrics and quality_metrics[metric] < threshold:
                return False
        
        # Overall quality check
        overall_score = sum(quality_metrics.values()) / len(quality_metrics) if quality_metrics else 0
        return overall_score >= self.min_quality_threshold
    
    def generate_recommendations(self, quality_metrics: Dict[str, float], optimizations_applied: List[str], quality_gates_passed: bool) -> Dict[str, Any]:
        """Generate optimization recommendations"""
        recommendations = {
            'quality_improvements': [],
            'optimization_suggestions': [],
            'next_actions': []
        }
        
        # Quality improvement recommendations
        for metric, score in quality_metrics.items():
            if score < 0.7:
                if metric == 'completeness':
                    recommendations['quality_improvements'].append('Consider providing more detailed explanations')
                elif metric == 'clarity':
                    recommendations['quality_improvements'].append('Break down complex sentences for better clarity')
                elif metric == 'actionability':
                    recommendations['quality_improvements'].append('Add more specific action items and recommendations')
                elif metric == 'accuracy':
                    recommendations['quality_improvements'].append('Include more technical details and specifics')
                elif metric == 'helpfulness':
                    recommendations['quality_improvements'].append('Add examples and explanations for better understanding')
        
        # Optimization suggestions
        if 'compression' not in optimizations_applied:
            recommendations['optimization_suggestions'].append('Response could benefit from compression optimization')
        
        if not any('focus_' in opt for opt in optimizations_applied):
            recommendations['optimization_suggestions'].append('Consider focusing on specific areas of interest')
        
        if not any('expertise_' in opt for opt in optimizations_applied):
            recommendations['optimization_suggestions'].append('Adjust response for user expertise level')
        
        # Next actions
        if not quality_gates_passed:
            recommendations['next_actions'].append('Review and improve response quality before delivery')
        
        if quality_metrics.get('actionability', 0) < 0.5:
            recommendations['next_actions'].append('Add more specific, actionable recommendations')
        
        return recommendations
    
    def format_output(self, result: PostPromptResult) -> Dict[str, Any]:
        """Format result for output"""
        return {
            'success': True,
            'hook': 'PostPrompt',
            'optimized_response': result.optimized_response,
            'optimizations_applied': result.optimizations_applied,
            'quality_metrics': result.quality_metrics,
            'quality_gates_passed': result.quality_gates_passed,
            'processing_time': result.processing_time,
            'recommendations': result.recommendations,
            'metadata': {
                'optimization_enabled': self.enable_optimization,
                'quality_gates_enabled': self.enable_quality_gates,
                'min_quality_threshold': self.min_quality_threshold,
                'response_length_before': 0,  # Would need original response
                'response_length_after': len(result.optimized_response)
            }
        }

def main():
    """Main function for hook execution"""
    hook = PostPromptHook()
    
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        
        # Handle empty input
        if not input_data.strip():
            context = {
                'response': 'This is a test response for quality validation.',
                'optimization_hints': {},
                'quality_requirements': {}
            }
        else:
            context = json.loads(input_data)
        
        # Process response
        result = hook.process_response(context)
        
        # Format and output result
        output = hook.format_output(result)
        print(json.dumps(output, indent=2))
        
        return 0
        
    except json.JSONDecodeError as e:
        error_output = {
            'success': False,
            'hook': 'PostPrompt',
            'error': f'Invalid JSON input: {e}',
            'processing_time': 0
        }
        print(json.dumps(error_output, indent=2))
        return 1
        
    except Exception as e:
        error_output = {
            'success': False,
            'hook': 'PostPrompt',
            'error': str(e),
            'processing_time': 0
        }
        print(json.dumps(error_output, indent=2))
        return 1

if __name__ == '__main__':
    sys.exit(main())