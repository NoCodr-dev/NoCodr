// Copyright 2025 NoCoder Inc.
// SPDX-License-Identifier: Apache-2.0

export interface Agent {
	id: string;
	name: string;
	role: AgentRole;
	status: AgentStatus;
	capabilities: string[];
}

export type AgentRole = 
	| 'planner'
	| 'coder' 
	| 'debugger' 
	| 'tester' 
	| 'verifier'
	| 'architect';

export type AgentStatus = 
	| 'idle'
	| 'active'
	| 'busy'
	| 'error'
	| 'completed';

export interface Task {
	id: string;
	description: string;
	status: TaskStatus;
	assignedAgent?: string;
	createdAt: Date;
	updatedAt: Date;
}

export type TaskStatus = 
	| 'pending'
	| 'in-progress'
	| 'completed'
	| 'failed'
	| 'cancelled';

export interface MemoryItem {
	id: string;
	content: string;
	timestamp: Date;
	metadata: Record<string, any>;
}

export interface TraceEvent {
	id: string;
	timestamp: Date;
	agentId: string;
	action: string;
	input?: any;
	output?: any;
	duration?: number;
}