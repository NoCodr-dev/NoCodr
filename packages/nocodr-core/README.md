# @nocodr/core

NoCodr Core - Meta-Agent Orchestration Engine

## Overview

The `@nocodr/core` package provides the foundational orchestration capabilities for NoCodr's multi-agent system. It implements a sophisticated agent coordination framework that enables seamless collaboration between specialized AI agents.

## Features

### 🤖 Multi-Agent Orchestration
- **Planner Agent**: Task planning and workflow design
- **Coder Agent**: Code generation and implementation
- **Debugger Agent**: Error detection and bug fixing
- **Tester Agent**: Test case generation and execution
- **Verifier Agent**: Quality assurance and validation

### 🔄 Role Handoff Mechanisms
- Automatic agent transitions based on task progress
- Context preservation during handoffs
- Capability-based agent assignment
- Error recovery and fallback strategies

### 🧠 Shared Memory System
- Centralized knowledge base for inter-agent communication
- Advanced querying and filtering capabilities
- Memory persistence and snapshot management
- Observer pattern for real-time updates

### 📊 Trace & Replay Engine
- Comprehensive event logging and tracing
- Workflow replay with variable speed control
- Pattern detection and anomaly identification
- Export capabilities (JSON, CSV, Timeline)

## Installation

```bash
npm install @nocodr/core
```

## Quick Start

```typescript
import { MetaAgentOrchestrator } from '@nocodr/core';

// Initialize the orchestrator
const orchestrator = new MetaAgentOrchestrator();

// Create a task
const taskId = await orchestrator.createTask('Build a REST API for user management');

// Coordinate the workflow
const result = await orchestrator.coordinateWorkflow(taskId);

console.log('Task completed:', result);
```

## Architecture

### Agent Roles
Each agent specializes in specific aspects of software development:

- **Planner**: Breaks down complex tasks into manageable steps
- **Coder**: Generates implementation code based on specifications
- **Debugger**: Identifies and resolves issues in code
- **Tester**: Creates and executes comprehensive test suites
- **Verifier**: Ensures quality standards and compliance

### Memory Management
The shared memory system enables agents to:
- Share context and results
- Maintain conversation history
- Store intermediate artifacts
- Query previous interactions

### Workflow Orchestration
The orchestrator manages:
- Task assignment and tracking
- Agent coordination and handoffs
- Progress monitoring
- Result aggregation

## API Reference

### MetaAgentOrchestrator
Main orchestration class for managing agents and tasks.

#### Methods
- `createTask(description: string)`: Create a new task
- `assignTask(taskId: string, agentId: string)`: Assign task to agent
- `executeTask(taskId: string)`: Execute task with assigned agent
- `coordinateWorkflow(taskId: string)`: Run complete agent workflow
- `handoffTask(taskId: string, fromAgent: string, toAgent: string, reason: string)`: Transfer task between agents

### SharedMemory
Centralized memory system for agent communication.

#### Methods
- `set(key: string, content: any)`: Store data in memory
- `get(key: string)`: Retrieve data from memory
- `query(options: MemoryQueryOptions)`: Advanced memory querying
- `subscribe(observer: Function)`: Subscribe to memory changes

### TraceEngine
Comprehensive event tracing and replay system.

#### Methods
- `recordEvent(agentId: string, action: string, data: any)`: Record trace event
- `replay(options: ReplayOptions)`: Replay recorded events
- `query(options: TraceQueryOptions)`: Query trace events
- `exportToJSON()`: Export trace data to JSON

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and development process.

## License

Apache 2.0 © NoCoder Inc.