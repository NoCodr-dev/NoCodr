/*
 * Copyright 2025 NoCoder Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface GraphNode {
    id: string
    type: string
    name: string
    description?: string
    position: { x: number; y: number }
    inputs: NodeInput[]
    outputs: NodeOutput[]
    properties: Record<string, any>
    metadata?: Record<string, any>
}

export interface NodeInput {
    id: string
    name: string
    type: string
    required: boolean
    defaultValue?: any
}

export interface NodeOutput {
    id: string
    name: string
    type: string
}

export interface GraphEdge {
    id: string
    sourceNodeId: string
    sourceOutputId: string
    targetNodeId: string
    targetInputId: string
    metadata?: Record<string, any>
}

export interface AgentGraphNode extends GraphNode {
    type: "agent"
    agentType: "planner" | "coder" | "debugger" | "tester" | "verifier"
    capabilities: string[]
    configuration: Record<string, any>
}

export interface WorkflowGraphNode extends GraphNode {
    type: "workflow"
    steps: WorkflowStep[]
    configuration: Record<string, any>
}

export interface WorkflowStep {
    id: string
    name: string
    agentType: "planner" | "coder" | "debugger" | "tester" | "verifier"
    configuration: Record<string, any>
    dependencies: string[]
}

export interface AgentGraph {
    id: string
    name: string
    description?: string
    version: string
    nodes: GraphNode[]
    edges: GraphEdge[]
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

export interface GraphExecutionResult {
    success: boolean
    outputs: Record<string, any>
    errors: string[]
    executionTime: number
    steps: ExecutionStep[]
}

export interface ExecutionStep {
    nodeId: string
    status: "pending" | "running" | "completed" | "failed"
    startTime: number
    endTime?: number
    output?: any
    error?: string
}