// Copyright 2025 NoCoder Inc.
// SPDX-License-Identifier: Apache-2.0

import { Agent, AgentRole, Task, TaskStatus } from './types';
import { BaseAgent, PlannerAgent, CoderAgent, DebuggerAgent, TesterAgent, VerifierAgent } from './agents';
import { SharedMemory } from './memory';
import { TraceEngine } from './trace';

export interface HandoffContext {
	fromAgent: string;
	toAgent: string;
	reason: string;
	data: any;
	timestamp: Date;
}

export interface WorkflowStep {
	id: string;
	name: string;
	agentRole: AgentRole;
	status: 'pending' | 'in-progress' | 'completed' | 'failed';
	dependencies: string[];
	startTime?: Date;
	endTime?: Date;
	result?: any;
}

export class MetaAgentOrchestrator {
	private agents: Map<string, BaseAgent> = new Map();
	private tasks: Map<string, Task> = new Map();
	private memory: SharedMemory;
	private traceEngine: TraceEngine;
	private handoffHistory: HandoffContext[] = [];
	private workflowSteps: Map<string, WorkflowStep[]> = new Map();

	constructor() {
		this.memory = new SharedMemory();
		this.traceEngine = new TraceEngine();
		this.initializeDefaultAgents();
	}

	private initializeDefaultAgents(): void {
		const planner = new PlannerAgent('planner-1');
		const coder = new CoderAgent('coder-1');
		const debuggerAgent = new DebuggerAgent('debugger-1');
		const tester = new TesterAgent('tester-1');
		const verifier = new VerifierAgent('verifier-1');

		this.agents.set(planner.id, planner);
		this.agents.set(coder.id, coder);
		this.agents.set(debuggerAgent.id, debuggerAgent);
		this.agents.set(tester.id, tester);
		this.agents.set(verifier.id, verifier);
	}

	async createTask(description: string): Promise<string> {
		const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const task: Task = {
			id: taskId,
			description,
			status: 'pending',
			createdAt: new Date(),
			updatedAt: new Date()
		};

		this.tasks.set(taskId, task);
		this.logTrace('task-created', taskId, { description });

		return taskId;
	}

	async assignTask(taskId: string, agentId: string): Promise<void> {
		const task = this.tasks.get(taskId);
		const agent = this.agents.get(agentId);

		if (!task) {
			throw new Error(`Task ${taskId} not found`);
		}

		if (!agent) {
			throw new Error(`Agent ${agentId} not found`);
		}

		task.assignedAgent = agentId;
		task.status = 'in-progress';
		task.updatedAt = new Date();

		this.tasks.set(taskId, task);
		this.logTrace('task-assigned', taskId, { agentId });
	}

	async executeTask(taskId: string): Promise<any> {
		const task = this.tasks.get(taskId);
		if (!task) {
			throw new Error(`Task ${taskId} not found`);
		}

		if (!task.assignedAgent) {
			throw new Error(`Task ${taskId} is not assigned to any agent`);
		}

		const agent = this.agents.get(task.assignedAgent);
		if (!agent) {
			throw new Error(`Assigned agent ${task.assignedAgent} not found`);
		}

		try {
			// Create agent context with shared memory
			const agentContext = {
				memory: this.memory,
				previousResults: this.getPreviousResults(taskId),
				taskHistory: Array.from(this.tasks.values())
			};

			const result = await agent.executeTask(task, agentContext);
			task.status = 'completed';
			task.updatedAt = new Date();
			this.tasks.set(taskId, task);
			this.logTrace('task-completed', taskId, { result });

			// Store result in shared memory
			this.memory.set(`task-result-${taskId}`, result, {
				agentId: agent.id,
				taskId: taskId,
				timestamp: new Date().toISOString()
			});

			return result;
		} catch (error) {
			task.status = 'failed';
			task.updatedAt = new Date();
			this.tasks.set(taskId, task);
			this.logTrace('task-failed', taskId, { error: (error as Error).message });
			throw error;
		}
	}

	getAgent(agentId: string): BaseAgent | undefined {
		return this.agents.get(agentId);
	}

	getTask(taskId: string): Task | undefined {
		return this.tasks.get(taskId);
	}

	getAllAgents(): BaseAgent[] {
		return Array.from(this.agents.values());
	}

	getAllTasks(): Task[] {
		return Array.from(this.tasks.values());
	}

	getMemory(): SharedMemory {
		return this.memory;
	}

	getTraceEngine(): TraceEngine {
		return this.traceEngine;
	}

	private logTrace(action: string, taskId: string, data: any): void {
		this.traceEngine.recordEvent('orchestrator', action, { taskId, ...data });
	}

	getTraceEvents(): any[] {
		return this.traceEngine.getAllEvents();
	}

	// Role handoff mechanisms

	async handoffTask(taskId: string, fromAgentId: string, toAgentId: string, reason: string): Promise<void> {
		const task = this.getTask(taskId);
		const fromAgent = this.getAgent(fromAgentId);
		const toAgent = this.getAgent(toAgentId);

		if (!task) {
			throw new Error(`Task ${taskId} not found`);
		}

		if (!fromAgent) {
			throw new Error(`From agent ${fromAgentId} not found`);
		}

		if (!toAgent) {
			throw new Error(`To agent ${toAgentId} not found`);
		}

		// Record handoff context
		const handoffContext: HandoffContext = {
			fromAgent: fromAgentId,
			toAgent: toAgentId,
			reason,
			data: {
				taskId,
				taskDescription: task.description,
				fromAgentStatus: fromAgent.getStatus(),
				currentResult: this.memory.get(`task-result-${taskId}`)
			},
			timestamp: new Date()
		};

		this.handoffHistory.push(handoffContext);

		// Transfer task assignment
		await this.assignTask(taskId, toAgentId);

		// Log the handoff
		this.logTrace('task-handoff', taskId, {
			fromAgent: fromAgentId,
			toAgent: toAgentId,
			reason
		});

		console.log(`Handoff: ${fromAgentId} → ${toAgentId} for task ${taskId} (${reason})`);
	}

	getHandoffHistory(): HandoffContext[] {
		return [...this.handoffHistory];
	}

	// Workflow orchestration with role handoff

	async coordinateWorkflow(taskId: string): Promise<any> {
		const task = this.getTask(taskId);
		if (!task) {
			throw new Error(`Task ${taskId} not found`);
		}

		// Initialize workflow steps
		const workflowId = `workflow-${taskId}`;
		const steps: WorkflowStep[] = [
			{
				id: 'plan',
				name: 'Planning Phase',
				agentRole: 'planner',
				status: 'pending',
				dependencies: []
			},
			{
				id: 'code',
				name: 'Coding Phase',
				agentRole: 'coder',
				status: 'pending',
				dependencies: ['plan']
			},
			{
				id: 'test',
				name: 'Testing Phase',
				agentRole: 'tester',
				status: 'pending',
				dependencies: ['code']
			},
			{
				id: 'debug',
				name: 'Debugging Phase',
				agentRole: 'debugger',
				status: 'pending',
				dependencies: ['test']
			},
			{
				id: 'verify',
				name: 'Verification Phase',
				agentRole: 'verifier',
				status: 'pending',
				dependencies: ['debug']
			}
		];

		this.workflowSteps.set(workflowId, steps);

		// Execute workflow steps with automatic handoff
		for (const step of steps) {
			await this.executeWorkflowStep(taskId, step);
		}

		// Collect final results
		const results = {
			taskId,
			plan: this.memory.get(`task-plan-${taskId}`),
			code: this.memory.get(`task-code-${taskId}`),
			tests: this.memory.get(`task-test-${taskId}`),
			debug: this.memory.get(`task-debug-${taskId}`),
			verification: this.memory.get(`task-verify-${taskId}`)
		};

		return results;
	}

	private async executeWorkflowStep(taskId: string, step: WorkflowStep): Promise<void> {
		const task = this.getTask(taskId);
		if (!task) {
			throw new Error(`Task ${taskId} not found`);
		}

		// Check dependencies
		const workflowId = `workflow-${taskId}`;
		const allSteps = this.workflowSteps.get(workflowId) || [];
		
		const unmetDependencies = step.dependencies.filter(depId => {
			const depStep = allSteps.find(s => s.id === depId);
			return depStep && depStep.status !== 'completed';
		});

		if (unmetDependencies.length > 0) {
			throw new Error(`Step ${step.id} has unmet dependencies: ${unmetDependencies.join(', ')}`);
		}

		// Find agent for this role
		const agent = this.getAgentByRole(step.agentRole);
		if (!agent) {
			throw new Error(`No agent found for role: ${step.agentRole}`);
		}

		// Update step status
		step.status = 'in-progress';
		step.startTime = new Date();

		try {
			// Assign and execute task
			await this.assignTask(taskId, agent.id);
			
			const result = await this.executeTask(taskId);
			
			// Store result in memory with step-specific key
			this.memory.set(`task-${step.id}-${taskId}`, result, {
				agentId: agent.id,
				stepId: step.id,
				timestamp: new Date().toISOString()
			});

			// Update step status
			step.status = 'completed';
			step.endTime = new Date();
			step.result = result;

			console.log(`Completed step: ${step.name} with agent ${agent.id}`);
		} catch (error) {
			step.status = 'failed';
			step.endTime = new Date();
			throw error;
		}
	}

	private getAgentByRole(role: AgentRole): BaseAgent | undefined {
		for (const agent of this.agents.values()) {
			if (agent.role === role) {
				return agent;
			}
		}
		return undefined;
	}

	private getPreviousResults(taskId: string): Record<string, any> {
		const results: Record<string, any> = {};
		const prefixes = ['plan', 'code', 'test', 'debug'];
		
		for (const prefix of prefixes) {
			const key = `task-${prefix}-${taskId}`;
			const result = this.memory.get(key);
			if (result !== undefined) {
				results[prefix] = result;
			}
		}
		
		return results;
	}

	// Dynamic role assignment based on task requirements

	async assignOptimalAgent(taskId: string, requiredCapabilities: string[]): Promise<string> {
		const task = this.getTask(taskId);
		if (!task) {
			throw new Error(`Task ${taskId} not found`);
		}

		// Score agents based on capabilities
		const agentScores = new Map<string, number>();

		for (const agent of this.agents.values()) {
			let score = 0;
			
			// Score based on matching capabilities
			for (const capability of requiredCapabilities) {
				if (agent.capabilities.includes(capability)) {
					score += 1;
				}
			}

			// Bonus for idle agents
			if (agent.getStatus() === 'idle') {
				score += 0.5;
			}

			agentScores.set(agent.id, score);
		}

		// Find agent with highest score
		let bestAgentId = '';
		let bestScore = -1;

		for (const [agentId, score] of agentScores) {
			if (score > bestScore) {
				bestScore = score;
				bestAgentId = agentId;
			}
		}

		if (bestAgentId) {
			await this.assignTask(taskId, bestAgentId);
			this.logTrace('optimal-agent-assigned', taskId, {
				agentId: bestAgentId,
				score: bestScore,
				capabilities: requiredCapabilities
			});
		}

		return bestAgentId;
	}

	// Conditional handoff based on task progress

	async evaluateAndHandoff(taskId: string): Promise<boolean> {
		const task = this.getTask(taskId);
		if (!task) {
			throw new Error(`Task ${taskId} not found`);
		}

		const currentAgent = task.assignedAgent ? this.getAgent(task.assignedAgent) : null;
		if (!currentAgent) {
			return false;
		}

		// Check if handoff is needed based on agent status or task complexity
		const shouldHandoff = this.shouldHandoffTask(task, currentAgent);
		if (!shouldHandoff) {
			return false;
		}

		// Determine next agent based on task progress
		const nextAgentRole = this.determineNextAgentRole(task, currentAgent);
		const nextAgent = this.getAgentByRole(nextAgentRole);
		
		if (nextAgent) {
			await this.handoffTask(
				taskId, 
				currentAgent.id, 
				nextAgent.id, 
				`Automatic handoff from ${currentAgent.role} to ${nextAgentRole}`
			);
			return true;
		}

		return false;
	}

	private shouldHandoffTask(task: Task, agent: BaseAgent): boolean {
		// Handoff conditions:
		// 1. Agent is stuck or error state
		if (agent.getStatus() === 'error') {
			return true;
		}

		// 2. Task has been with agent too long (simulated)
		const timeWithAgent = Date.now() - (task.updatedAt?.getTime() || task.createdAt.getTime());
		if (timeWithAgent > 300000) { // 5 minutes
			return true;
		}

		// 3. Agent indicates need for handoff (in real implementation, this would be more sophisticated)
		const agentContext = agent.getContext();
		const recentErrors = agentContext.memory.query({
			filterByAgent: agent.id,
			filterByType: 'error',
			limit: 5
		});

		return recentErrors.length > 3;
	}

	private determineNextAgentRole(task: Task, currentAgent: BaseAgent): AgentRole {
		// Simple state machine for role transitions
		const roleTransitions: Record<AgentRole, AgentRole> = {
			'planner': 'coder',
			'coder': 'tester',
			'debugger': 'coder',
			'tester': 'debugger',
			'verifier': 'planner',
			'architect': 'planner'
		};

		return roleTransitions[currentAgent.role] || 'planner';
	}
}