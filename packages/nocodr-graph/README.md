# @nocodr/graph - Agent Graph Studio

Visual workflow editor and runtime engine for NoCodr's agent orchestration system.

## Overview

The Agent Graph Studio provides a visual interface for designing, editing, and executing complex AI agent workflows. It allows users to create directed graphs where nodes represent AI agents (Planner, Coder, Debugger, Tester, Verifier) and edges represent data flow between them.

## Features

### 🎨 Visual Graph Editor
- Drag-and-drop node placement
- Grid snapping for precise alignment
- Visual connection lines with arrowheads
- Node selection and manipulation
- Real-time rendering

### 📊 Graph Management
- Create and manage agent nodes
- Create and manage workflow nodes
- Connect nodes with directed edges
- Validate graph structure
- Import/export in .nflow format

### ⚡ Runtime Execution
- Topological sorting for execution order
- Step-by-step execution tracking
- Error handling and recovery
- Execution result aggregation
- Performance monitoring

### 📁 File Format (.nflow)
- Standardized JSON format for agent workflows
- Version control friendly
- Metadata preservation
- Cross-platform compatibility

## Installation

```bash
npm install @nocodr/graph
```

## Usage

### Basic Graph Creation

```typescript
import { AgentGraphManager } from '@nocodr/graph'

// Create a new graph manager
const graphManager = new AgentGraphManager()

// Create agent nodes
const planner = graphManager.createAgentNode('Task Planner', 'planner', { x: 100, y: 100 })
const coder = graphManager.createAgentNode('Code Generator', 'coder', { x: 300, y: 100 })
const tester = graphManager.createAgentNode('Code Tester', 'tester', { x: 500, y: 100 })

// Connect nodes
graphManager.addEdge(planner.id, 'planOutput', coder.id, 'planInput')
graphManager.addEdge(coder.id, 'codeOutput', tester.id, 'codeInput')

// Validate the graph
const validation = graphManager.validate()
if (validation.isValid) {
  console.log('Graph is valid!')
}
```

### Graph Serialization

```typescript
import { GraphSerializer } from '@nocodr/graph'

// Export to .nflow file
const graph = graphManager.getGraph()
GraphSerializer.exportToFile(graph, 'my-workflow.nflow')

// Import from .nflow file
const importedGraph = await GraphSerializer.importFromFile(file)
```

### Graph Execution

```typescript
import { GraphRuntime } from '@nocodr/graph'
import { MetaAgentOrchestrator } from '@nocodr/core'

// Create runtime with orchestrator
const orchestrator = new MetaAgentOrchestrator()
const runtime = new GraphRuntime(orchestrator)

// Execute the graph
const result = await runtime.executeGraph(graph, {
  input: 'Build a REST API for user management'
})

console.log('Execution completed:', result.success)
console.log('Results:', result.outputs)
console.log('Execution time:', result.executionTime, 'ms')
```

## API Reference

### AgentGraphManager

Main class for managing agent graphs.

#### Methods
- `createAgentNode(name, agentType, position)` - Create a new agent node
- `createWorkflowNode(name, position)` - Create a new workflow node
- `addEdge(sourceNodeId, sourceOutputId, targetNodeId, targetInputId)` - Add connection between nodes
- `removeNode(nodeId)` - Remove a node and its connections
- `removeEdge(edgeId)` - Remove a connection
- `getGraph()` - Get the current graph
- `validate()` - Validate graph structure

### GraphEditor

Visual editor component for graph manipulation.

#### Methods
- `createAgentNode(name, agentType, position)` - Create and visualize an agent node
- `createWorkflowNode(name, position)` - Create and visualize a workflow node
- `addEdge(sourceNodeId, sourceOutputId, targetNodeId, targetInputId)` - Create and visualize a connection
- `removeNode(nodeId)` - Remove node from visualization
- `render()` - Redraw the graph
- `setContainer(container)` - Set the HTML container for rendering

### GraphSerializer

Handles import/export of graphs in .nflow format.

#### Methods
- `serializeToNFlow(graph)` - Convert graph to JSON string
- `deserializeFromNFlow(json)` - Convert JSON string to graph
- `exportToFile(graph, filename)` - Export graph to downloadable file
- `importFromFile(file)` - Import graph from file
- `validateNFlow(json)` - Validate .nflow file structure

### GraphRuntime

Executes agent graphs with proper orchestration.

#### Methods
- `executeGraph(graph, inputs)` - Execute a graph with given inputs
- `getExecutionStatus()` - Get current execution status
- `cancelExecution()` - Cancel ongoing execution

## File Format (.nflow)

The .nflow format is a standardized JSON structure for agent workflows:

```json
{
  "version": "1.0.0",
  "graph": {
    "id": "unique-graph-id",
    "name": "Workflow Name",
    "description": "Workflow Description",
    "version": "1.0.0",
    "nodes": [
      {
        "id": "node-1",
        "type": "agent",
        "agentType": "planner",
        "name": "Task Planner",
        "position": { "x": 100, "y": 100 },
        "inputs": [],
        "outputs": [],
        "properties": {},
        "capabilities": [],
        "configuration": {}
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "sourceNodeId": "node-1",
        "sourceOutputId": "output1",
        "targetNodeId": "node-2",
        "targetInputId": "input1"
      }
    ],
    "metadata": {},
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "metadata": {
    "exporter": "NoCodr Graph Studio",
    "exportDate": "2025-01-01T00:00:00.000Z"
  }
}
```

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.

Copyright 2025 NoCoder Inc.