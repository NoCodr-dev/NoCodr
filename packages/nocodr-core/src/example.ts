// Copyright 2025 NoCoder Inc.
// SPDX-License-Identifier: Apache-2.0

import { MetaAgentOrchestrator } from './orchestrator';

async function main() {
	console.log('🚀 NoCodr Core - Meta-Agent Orchestration Demo');
	console.log('===============================================');
	
	const orchestrator = new MetaAgentOrchestrator();
	
	// Create a sample task
	const taskId = await orchestrator.createTask('Build a user authentication system with JWT tokens');
	console.log(`📋 Created task: ${taskId}`);
	
	// Coordinate the workflow
	console.log('🤖 Starting workflow coordination...');
	const result = await orchestrator.coordinateWorkflow(taskId);
	
	console.log('✅ Workflow completed successfully!');
	console.log(`📊 Results generated for ${Object.keys(result).length - 1} phases`);
	
	// Show memory usage
	const memory = orchestrator.getMemory();
	console.log(`💾 Memory items stored: ${memory.size()}`);
	
	// Show trace events
	const traceEvents = orchestrator.getTraceEvents();
	console.log(`📈 Trace events recorded: ${traceEvents.length}`);
	
	// Show handoff history
	const handoffHistory = orchestrator.getHandoffHistory();
	if (handoffHistory.length > 0) {
		console.log(`🔄 Agent handoffs performed: ${handoffHistory.length}`);
	}
	
	console.log('\n🎉 Demo completed successfully!');
}

// Run the example if this file is executed directly
if (require.main === module) {
	main().catch(console.error);
}

export { main };