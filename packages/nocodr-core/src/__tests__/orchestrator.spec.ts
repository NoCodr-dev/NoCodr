// Copyright 2025 NoCoder Inc.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest';
import { MetaAgentOrchestrator } from '../orchestrator';
import { PlannerAgent, CoderAgent } from '../agents';

describe('MetaAgentOrchestrator', () => {
	it('should create and manage agents', () => {
		const orchestrator = new MetaAgentOrchestrator();
		
		const agents = orchestrator.getAllAgents();
		expect(agents.length).toBeGreaterThan(0);
		
		const planner = orchestrator.getAgent('planner-1');
		expect(planner).toBeDefined();
		expect(planner?.role).toBe('planner');
	});

	it('should create and manage tasks', async () => {
		const orchestrator = new MetaAgentOrchestrator();
		
		const taskId = await orchestrator.createTask('Test task');
		expect(taskId).toBeDefined();
		
		const task = orchestrator.getTask(taskId);
		expect(task).toBeDefined();
		expect(task?.description).toBe('Test task');
		expect(task?.status).toBe('pending');
	});

	it('should have shared memory system', () => {
		const orchestrator = new MetaAgentOrchestrator();
		const memory = orchestrator.getMemory();
		
		expect(memory).toBeDefined();
		expect(memory.size()).toBe(0);
	});
});