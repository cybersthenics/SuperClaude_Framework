#!/usr/bin/env python3
"""
MorphLLM Integration Tests
Test suite for validating MorphLLM integration with SuperClaude framework.

This test suite validates:
1. Hook system functionality
2. Tool interception and routing
3. Performance monitoring
4. Error handling and fallback mechanisms
5. Configuration validation

Author: SuperClaude Framework
Version: 3.0.0
"""

import unittest
import json
import os
import sys
import tempfile
import shutil
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path

# Add the SuperClaude directory to the path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Import MorphLLM modules
from SuperClaude.Hooks.morph_tool_interceptor import MorphToolInterceptor
from SuperClaude.Hooks.morph_performance_monitor import MorphPerformanceMonitor
from SuperClaude.Hooks.morph_error_handler import MorphErrorHandler, ErrorType, FallbackStrategy

class TestMorphLLMIntegration(unittest.TestCase):
    """Test suite for MorphLLM integration"""
    
    def setUp(self):
        """Set up test environment"""
        self.test_dir = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.test_dir)
        
        # Mock environment variables
        self.env_patcher = patch.dict('os.environ', {
            'MORPH_API_KEY': 'test_api_key',
            'MORPH_SERVER_URL': 'http://localhost:8000',
            'HOME': self.test_dir
        })
        self.env_patcher.start()
        self.addCleanup(self.env_patcher.stop)
        
        # Create test files
        self.test_file = os.path.join(self.test_dir, 'test_file.txt')
        with open(self.test_file, 'w') as f:
            f.write('test content')
    
    def test_tool_interceptor_initialization(self):
        """Test MorphToolInterceptor initialization"""
        interceptor = MorphToolInterceptor()
        
        self.assertIsNotNone(interceptor.session_stats)
        self.assertEqual(interceptor.session_stats['total_operations'], 0)
        self.assertEqual(interceptor.session_stats['morph_operations'], 0)
        self.assertEqual(interceptor.session_stats['native_operations'], 0)
    
    def test_tool_mapping(self):
        """Test tool mapping functionality"""
        interceptor = MorphToolInterceptor()
        
        # Test standard tool mapping
        tool_name = "Read"
        tool_input = {"file_path": self.test_file}
        
        morph_call = interceptor.create_morph_tool_call(tool_name, tool_input)
        
        self.assertEqual(morph_call['tool'], 'mcp__morph__read_file')
        self.assertEqual(morph_call['original_tool'], 'Read')
        self.assertEqual(morph_call['input'], tool_input)
        
    def test_morph_flag_detection(self):
        """Test MorphLLM flag detection"""
        interceptor = MorphToolInterceptor()
        
        # Test --morph flag
        flags = ['--morph']
        result = interceptor.should_intercept('Read', {}, flags)
        self.assertTrue(result)
        
        # Test --no-morph flag
        flags = ['--no-morph']
        result = interceptor.should_intercept('Read', {}, flags)
        self.assertFalse(result)
        
        # Test --morph-only flag
        flags = ['--morph-only']
        result = interceptor.should_intercept('Read', {}, flags)
        self.assertTrue(result)
    
    def test_auto_activation(self):
        """Test auto-activation logic"""
        interceptor = MorphToolInterceptor()
        
        # Simulate multiple filesystem operations
        interceptor.session_stats['total_operations'] = 6
        
        result = interceptor.should_auto_activate('Read', {}, [])
        self.assertTrue(result)
        
        # Test with low operation count
        interceptor.session_stats['total_operations'] = 2
        result = interceptor.should_auto_activate('Read', {}, [])
        self.assertFalse(result)
    
    def test_server_validation(self):
        """Test MorphLLM server validation"""
        interceptor = MorphToolInterceptor()
        
        # Should pass with mocked environment variables
        result = interceptor.validate_morph_server()
        self.assertTrue(result)
        
        # Test with missing API key
        with patch.dict('os.environ', {}, clear=True):
            result = interceptor.validate_morph_server()
            self.assertFalse(result)
    
    def test_performance_monitor_initialization(self):
        """Test MorphPerformanceMonitor initialization"""
        monitor = MorphPerformanceMonitor()
        
        self.assertIsNotNone(monitor.session_id)
        self.assertTrue(monitor.metrics_file.endswith('morph_performance.json'))
        self.assertTrue(monitor.summary_file.endswith('morph_performance_summary.json'))
    
    def test_operation_detection(self):
        """Test operation type detection"""
        monitor = MorphPerformanceMonitor()
        
        # Test MorphLLM operation detection
        morph_result = {"morph_metadata": {"original_tool": "Read"}}
        result = monitor.is_morph_operation("mcp__morph__read_file", morph_result)
        self.assertTrue(result)
        
        # Test native operation detection
        native_result = {"success": True}
        result = monitor.is_morph_operation("Read", native_result)
        self.assertFalse(result)
    
    def test_metrics_recording(self):
        """Test metrics recording functionality"""
        monitor = MorphPerformanceMonitor()
        
        tool_name = "mcp__morph__read_file"
        tool_input = {"file_path": self.test_file}
        tool_result = {"success": True, "morph_metadata": {"original_tool": "Read"}}
        execution_time = 0.5
        
        # Should not raise exception
        monitor.record_operation_metrics(tool_name, tool_input, tool_result, execution_time)
        
        # Check if metrics file was created
        self.assertTrue(os.path.exists(monitor.metrics_file))
    
    def test_error_handler_initialization(self):
        """Test MorphErrorHandler initialization"""
        handler = MorphErrorHandler()
        
        self.assertIsNotNone(handler.session_id)
        self.assertTrue(handler.error_log_file.endswith('morph_errors.log'))
        self.assertTrue(handler.fallback_stats_file.endswith('morph_fallback_stats.json'))
    
    def test_error_classification(self):
        """Test error classification"""
        handler = MorphErrorHandler()
        
        # Test server unavailable error
        error_type = handler.classify_error("Connection failed: server unavailable", {})
        self.assertEqual(error_type, ErrorType.SERVER_UNAVAILABLE)
        
        # Test API key error
        error_type = handler.classify_error("Authentication failed: invalid API key", {})
        self.assertEqual(error_type, ErrorType.API_KEY_INVALID)
        
        # Test timeout error
        error_type = handler.classify_error("Operation timed out", {})
        self.assertEqual(error_type, ErrorType.TIMEOUT)
        
        # Test unknown error
        error_type = handler.classify_error("Unknown error occurred", {})
        self.assertEqual(error_type, ErrorType.UNKNOWN_ERROR)
    
    def test_fallback_strategy_selection(self):
        """Test fallback strategy selection"""
        handler = MorphErrorHandler()
        
        # Create error context
        error_context = handler.create_error_context(
            "mcp__morph__read_file", 
            {"file_path": self.test_file},
            "Server unavailable",
            {}
        )
        
        strategy = handler.get_fallback_strategy(error_context)
        self.assertEqual(strategy, FallbackStrategy.NATIVE_TOOL)
    
    def test_native_tool_fallback(self):
        """Test fallback to native tool"""
        handler = MorphErrorHandler()
        
        error_context = handler.create_error_context(
            "mcp__morph__read_file",
            {"file_path": self.test_file},
            "Server unavailable",
            {}
        )
        
        response = handler.fallback_to_native_tool(error_context)
        
        self.assertEqual(response['action'], 'fallback')
        self.assertEqual(response['fallback_tool'], 'Read')
        self.assertEqual(response['fallback_input'], {"file_path": self.test_file})
    
    def test_configuration_validation(self):
        """Test configuration file validation"""
        
        # Test features.json
        features_file = os.path.join(os.path.dirname(__file__), '..', 'config', 'features.json')
        self.assertTrue(os.path.exists(features_file))
        
        with open(features_file, 'r') as f:
            features = json.load(f)
        
        self.assertIn('morphllm', features['components'])
        self.assertTrue(features['components']['morphllm']['enabled'])
        
        # Test requirements.json
        requirements_file = os.path.join(os.path.dirname(__file__), '..', 'config', 'requirements.json')
        self.assertTrue(os.path.exists(requirements_file))
        
        with open(requirements_file, 'r') as f:
            requirements = json.load(f)
        
        self.assertIn('morph_mcp_server', requirements['external_tools'])
        self.assertIn('morphllm', requirements['external_tools']['morph_mcp_server']['required_for'])
    
    def test_hook_files_existence(self):
        """Test that hook files exist and are executable"""
        
        hooks_dir = os.path.join(os.path.dirname(__file__), '..', 'SuperClaude', 'Hooks')
        
        # Check hook files exist
        hook_files = [
            'morph_tool_interceptor.py',
            'morph_performance_monitor.py',
            'morph_error_handler.py'
        ]
        
        for hook_file in hook_files:
            hook_path = os.path.join(hooks_dir, hook_file)
            self.assertTrue(os.path.exists(hook_path), f"Hook file {hook_file} not found")
            
            # Check file has main function
            with open(hook_path, 'r') as f:
                content = f.read()
                self.assertIn('def main()', content)
                self.assertIn('if __name__ == "__main__":', content)
    
    def test_integration_workflow(self):
        """Test complete integration workflow"""
        
        # Initialize components
        interceptor = MorphToolInterceptor()
        monitor = MorphPerformanceMonitor()
        handler = MorphErrorHandler()
        
        # Simulate tool call
        tool_name = "Read"
        tool_input = {"file_path": self.test_file}
        flags = ["--morph"]
        
        # Test interception
        should_intercept = interceptor.should_intercept(tool_name, tool_input, flags)
        self.assertTrue(should_intercept)
        
        # Test tool mapping
        morph_call = interceptor.create_morph_tool_call(tool_name, tool_input)
        self.assertEqual(morph_call['tool'], 'mcp__morph__read_file')
        
        # Simulate successful operation
        tool_result = {"success": True, "morph_metadata": {"original_tool": "Read"}}
        execution_time = 0.3
        
        # Test performance monitoring
        perf_result = monitor.process_tool_result(morph_call['tool'], tool_input, tool_result)
        self.assertEqual(perf_result['status'], 'success')
        
        # Test error handling (simulate error)
        error_message = "Test error"
        error_result = handler.handle_error(morph_call['tool'], tool_input, error_message, {})
        self.assertEqual(error_result['action'], 'fallback')

class TestMorphLLMConfiguration(unittest.TestCase):
    """Test configuration and setup validation"""
    
    def test_framework_integration(self):
        """Test SuperClaude framework integration"""
        
        # Test Core files updated
        core_files = [
            'FLAGS.md',
            'MCP.md', 
            'RULES.md'
        ]
        
        core_dir = os.path.join(os.path.dirname(__file__), '..', 'SuperClaude', 'Core')
        
        for core_file in core_files:
            file_path = os.path.join(core_dir, core_file)
            self.assertTrue(os.path.exists(file_path))
            
            with open(file_path, 'r') as f:
                content = f.read()
                self.assertIn('MorphLLM', content)
    
    def test_profile_configuration(self):
        """Test profile configuration"""
        
        profiles_dir = os.path.join(os.path.dirname(__file__), '..', 'profiles')
        developer_profile = os.path.join(profiles_dir, 'developer.json')
        
        self.assertTrue(os.path.exists(developer_profile))
        
        with open(developer_profile, 'r') as f:
            profile = json.load(f)
        
        self.assertIn('morphllm', profile['components'])

if __name__ == '__main__':
    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(TestMorphLLMIntegration)
    suite.addTest(unittest.TestLoader().loadTestsFromTestCase(TestMorphLLMConfiguration))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Exit with appropriate code
    sys.exit(0 if result.wasSuccessful() else 1)