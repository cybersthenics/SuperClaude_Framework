#!/usr/bin/env node

// Simple test client for SuperClaude Personas server
const { spawn } = require('child_process');

function testPersonasServer() {
    console.log('Testing SuperClaude Personas server...');
    
    // Start the server
    const server = spawn('node', ['dist/BasicServer.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: '.'
    });
    
    // Test messages
    const testMessages = [
        // List tools
        JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
            params: {}
        }),
        
        // Get persona recommendation
        JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'get_persona_recommendation',
                arguments: {
                    taskDescription: 'I need to optimize the performance of my web application'
                }
            }
        }),
        
        // Activate persona
        JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
                name: 'activate_persona',
                arguments: {
                    persona: 'performance',
                    context: {
                        domain: 'web-performance',
                        complexity: 0.8,
                        userIntent: 'optimize application performance'
                    }
                }
            }
        }),
        
        // Get persona priorities
        JSON.stringify({
            jsonrpc: '2.0',
            id: 4,
            method: 'tools/call',
            params: {
                name: 'get_persona_priorities',
                arguments: {
                    persona: 'architect'
                }
            }
        })
    ];
    
    let responseCount = 0;
    let responses = [];
    
    server.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
            try {
                const response = JSON.parse(line);
                responses.push(response);
                responseCount++;
                
                console.log(`Response ${responseCount}:`, JSON.stringify(response, null, 2));
                
                if (responseCount >= testMessages.length) {
                    server.kill();
                    console.log('\n✅ All tests completed successfully!');
                    console.log(`✅ Server responds to all ${testMessages.length} test messages`);
                    process.exit(0);
                }
            } catch (err) {
                // Ignore non-JSON lines (like startup messages)
            }
        });
    });
    
    server.stderr.on('data', (data) => {
        console.log('Server log:', data.toString());
    });
    
    server.on('close', (code) => {
        if (code === 0) {
            console.log('✅ Server test completed successfully');
        } else {
            console.log(`❌ Server exited with code ${code}`);
        }
    });
    
    // Send test messages with delay
    setTimeout(() => {
        testMessages.forEach((message, index) => {
            setTimeout(() => {
                server.stdin.write(message + '\n');
            }, index * 100);
        });
    }, 1000);
    
    // Timeout after 10 seconds
    setTimeout(() => {
        server.kill();
        console.log('❌ Test timed out');
        process.exit(1);
    }, 10000);
}

testPersonasServer();