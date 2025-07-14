#!/usr/bin/env node

/**
 * Test script for Enhanced SuperClaude Intelligence Server
 * Demonstrates LSP-powered Python analysis capabilities
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ServerTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = [];
  }

  async startServer() {
    console.log('Starting Enhanced SuperClaude Intelligence Server...');
    
    this.serverProcess = spawn('node', ['dist/EnhancedServer.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname
    });

    this.serverProcess.stderr.on('data', (data) => {
      console.log('Server:', data.toString());
    });

    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      };

      const requestStr = JSON.stringify(request);
      const header = `Content-Length: ${Buffer.byteLength(requestStr, 'utf8')}\\r\\n\\r\\n`;
      const fullRequest = header + requestStr;

      let response = '';
      
      const onData = (data) => {
        response += data.toString();
        
        // Look for complete JSON response
        const jsonMatch = response.match(/\\{.*\\}/s);
        if (jsonMatch) {
          this.serverProcess.stdout.removeListener('data', onData);
          try {
            const result = JSON.parse(jsonMatch[0]);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      };

      this.serverProcess.stdout.on('data', onData);
      this.serverProcess.stdin.write(fullRequest);

      // Timeout after 10 seconds
      setTimeout(() => {
        this.serverProcess.stdout.removeListener('data', onData);
        reject(new Error('Request timeout'));
      }, 10000);
    });
  }

  async testListTools() {
    console.log('\\n🧪 Testing: List Tools');
    
    try {
      const response = await this.sendRequest('tools/list');
      console.log('✅ Tools listed successfully');
      console.log(`   Found ${response.result?.tools?.length || 0} tools`);
      
      if (response.result?.tools) {
        response.result.tools.forEach(tool => {
          console.log(`   - ${tool.name}: ${tool.description}`);
        });
      }
      
      this.testResults.push({ test: 'List Tools', status: 'PASS' });
    } catch (error) {
      console.log('❌ Failed to list tools:', error.message);
      this.testResults.push({ test: 'List Tools', status: 'FAIL', error: error.message });
    }
  }

  async testAnalyzePythonFile() {
    console.log('\\n🧪 Testing: Analyze Python File');
    
    const testFilePath = path.join(__dirname, 'test_python_file.py');
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'analyze_python_file',
        arguments: {
          file_path: testFilePath,
          include_symbols: true,
          include_diagnostics: true
        }
      });
      
      console.log('✅ Python file analyzed successfully');
      
      if (response.result?.content?.[0]?.text) {
        const analysis = JSON.parse(response.result.content[0].text);
        console.log(`   File: ${analysis.file_path}`);
        console.log(`   Lines of code: ${analysis.lines_of_code}`);
        console.log(`   File size: ${analysis.file_size} bytes`);
        console.log(`   Symbols found: ${analysis.symbols?.length || 0}`);
      }
      
      this.testResults.push({ test: 'Analyze Python File', status: 'PASS' });
    } catch (error) {
      console.log('❌ Failed to analyze Python file:', error.message);
      this.testResults.push({ test: 'Analyze Python File', status: 'FAIL', error: error.message });
    }
  }

  async testServerStatus() {
    console.log('\\n🧪 Testing: Get Server Status');
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'get_server_status',
        arguments: {
          include_capabilities: true
        }
      });
      
      console.log('✅ Server status retrieved successfully');
      
      if (response.result?.content?.[0]?.text) {
        const status = JSON.parse(response.result.content[0].text);
        console.log(`   Total servers: ${status.total_servers}`);
        console.log(`   Healthy servers: ${status.healthy_servers}`);
        
        Object.entries(status.servers || {}).forEach(([lang, info]) => {
          console.log(`   ${lang}: ${info.status}`);
        });
      }
      
      this.testResults.push({ test: 'Get Server Status', status: 'PASS' });
    } catch (error) {
      console.log('❌ Failed to get server status:', error.message);
      this.testResults.push({ test: 'Get Server Status', status: 'FAIL', error: error.message });
    }
  }

  async testPythonCompletions() {
    console.log('\\n🧪 Testing: Python Code Completions');
    
    const testFilePath = path.join(__dirname, 'test_python_file.py');
    
    try {
      const response = await this.sendRequest('tools/call', {
        name: 'get_python_completions',
        arguments: {
          file_path: testFilePath,
          line: 20,  // Inside the DataProcessor class
          character: 8,
          max_results: 10
        }
      });
      
      console.log('✅ Python completions retrieved successfully');
      
      if (response.result?.content?.[0]?.text) {
        const completions = JSON.parse(response.result.content[0].text);
        console.log(`   Total available: ${completions.total_available}`);
        console.log(`   Returned: ${completions.returned}`);
        console.log(`   Position: line ${completions.position.line}, char ${completions.position.character}`);
      }
      
      this.testResults.push({ test: 'Python Code Completions', status: 'PASS' });
    } catch (error) {
      console.log('❌ Failed to get Python completions:', error.message);
      this.testResults.push({ test: 'Python Code Completions', status: 'FAIL', error: error.message });
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Enhanced SuperClaude Intelligence Server Tests\\n');
    
    try {
      await this.startServer();
      
      // Run tests
      await this.testListTools();
      await this.testServerStatus();
      await this.testAnalyzePythonFile();
      await this.testPythonCompletions();
      
      // Print results
      console.log('\\n📊 Test Results Summary:');
      console.log('═'.repeat(50));
      
      let passed = 0;
      let failed = 0;
      
      this.testResults.forEach(result => {
        const status = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${status} ${result.test}: ${result.status}`);
        if (result.error) {
          console.log(`    Error: ${result.error}`);
        }
        
        if (result.status === 'PASS') passed++;
        else failed++;
      });
      
      console.log('═'.repeat(50));
      console.log(`Total: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`);
      
      if (failed === 0) {
        console.log('\\n🎉 All tests passed! Enhanced server is working correctly.');
      } else {
        console.log(`\\n⚠️  ${failed} test(s) failed. See details above.`);
      }
      
    } catch (error) {
      console.error('❌ Test runner error:', error);
    } finally {
      if (this.serverProcess) {
        this.serverProcess.kill();
        console.log('\\n🛑 Server stopped');
      }
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ServerTester();
  tester.runAllTests().catch(console.error);
}