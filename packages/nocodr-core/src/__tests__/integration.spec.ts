// Copyright 2025 NoCoder Inc.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest';
import { MetaAgentOrchestrator } from '../orchestrator';

describe('MetaAgentOrchestrator Integration', () => {
	it('should coordinate a complete workflow', async () => {
		const orchestrator = new MetaAgentOrchestrator();
		
		// Create a task
		const taskId = await orchestrator.createTask('Create a simple REST API endpoint');
		expect(taskId).toBeDefined();
		
		// Coordinate the workflow
		const result = await orchestrator.coordinateWorkflow(taskId);
		
		// Verify results
		expect(result).toBeDefined();
		expect(result.taskId).toBe(taskId);
		expect(result.plan).toBeDefined();
		expect(result.code).toBeDefined();
		expect(result.tests).toBeDefined();
		expect(result.verification).toBeDefined();
		
		// Verify memory was used
		const memory = orchestrator.getMemory();
		expect(memory.size()).toBeGreaterThan(0);
		
		// Verify trace events were recorded
		const traceEvents = orchestrator.getTraceEvents();
		expect(traceEvents.length).toBeGreaterThan(0);
	});

	it('should handle agent handoff', async () => {
		const orchestrator = new MetaAgentOrchestrator();
		
		const taskId = await orchestrator.createTask('Debug a failing test');
		const planner = orchestrator.getAgent('planner-1');
		const coder = orchestrator.getAgent('coder-1');
		
		expect(planner).toBeDefined();
		expect(coder).toBeDefined();
		
		if (planner && coder) {
			// Assign to planner first
			await orchestrator.assignTask(taskId, planner.id);
			
			// Handoff to coder
			await orchestrator.handoffTask(taskId, planner.id, coder.id, 'Planning complete, time to code');
			
			// Verify handoff was recorded
			const handoffHistory = orchestrator.getHandoffHistory();
			expect(handoffHistory.length).toBe(1);
			expect(handoffHistory[0].fromAgent).toBe(planner.id);
			expect(handoffHistory[0].toAgent).toBe(coder.id);
		}
	});

	it('should use shared memory for inter-agent communication', async () => {
		const orchestrator = new MetaAgentOrchestrator();
		const memory = orchestrator.getMemory();
		
		// Store some data
		memory.set('test-key', { message: 'Hello from agent 1' }, { 
			agentId: 'agent-1', 
			type: 'communication' 
		});
		
		// Retrieve data
		const retrieved = memory.get('test-key');
		expect(retrieved).toBeDefined();
		expect(retrieved.message).toBe('Hello from agent 1');
		
		// Query memory
		const results = memory.query({ filterByAgent: 'agent-1' });
		expect(results.length).toBe(1);
		expect(results[0].metadata?.type).toBe('communication');
	});

	it('should provide trace and replay capabilities', async () => {
		const orchestrator = new MetaAgentOrchestrator();
		const traceEngine = orchestrator.getTraceEngine();
		
		// Record some events
		traceEngine.recordEvent('agent-1', 'task-started', { taskId: 'test-1' });
		traceEngine.recordEvent('agent-1', 'task-completed', { taskId: 'test-1', result: 'success' });
		
		// Query events
		const events = traceEngine.query({ filterByAgent: 'agent-1' });
		expect(events.length).toBe(2);
		
		// Get statistics
		const stats = traceEngine.getStats();
		expect(stats.totalEvents).toBe(2);
		expect(stats.eventsByAgent['agent-1']).toBe(2);
	});
});