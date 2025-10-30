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

import { AgentGraph, GraphNode, GraphEdge, GraphExecutionResult, ExecutionStep } from "./types"
import { MetaAgentOrchestrator } from "@nocodr/core"

export class GraphRuntime {
    private orchestrator: MetaAgentOrchestrator
    private executionSteps: Map<string, ExecutionStep> = new Map()
    private isExecuting: boolean = false

    constructor(orchestrator: MetaAgentOrchestrator) {
        this.orchestrator = orchestrator
    }

    /**
     * Execute an agent graph
     */
    public async executeGraph(graph: AgentGraph, inputs: Record<string, any> = {}): Promise<GraphExecutionResult> {
        if (this.isExecuting) {
            throw new Error("Graph is already executing")
        }

        this.isExecuting = true
        const startTime = Date.now()
        const errors: string[] = []
        const outputs: Record<string, any> = { ...inputs }
        
        try {
            // Initialize execution steps
            this.initializeExecutionSteps(graph)
            
            // Topologically sort nodes for execution order
            const sortedNodes = this.topologicalSort(graph)
            
            // Execute nodes in order
            for (const node of sortedNodes) {
                try {
                    await this.executeNode(node, graph, outputs)
                } catch (error) {
                    errors.push(`Failed to execute node ${node.name}: ${error instanceof Error ? error.message : String(error)}`)
                    this.markStepFailed(node.id, error instanceof Error ? error.message : String(error))
                    
                    // Continue with other nodes unless critical failure
                    // In a real implementation, you might want to stop on critical errors
                }
            }
            
            const executionTime = Date.now() - startTime
            
            return {
                success: errors.length === 0,
                outputs,
                errors,
                executionTime,
                steps: Array.from(this.executionSteps.values())
            }
            
        } finally {
            this.isExecuting = false
        }
    }

    /**
     * Initialize execution steps
     */
    private initializeExecutionSteps(graph: AgentGraph): void {
        this.executionSteps.clear()
        
        for (const node of graph.nodes) {
            this.executionSteps.set(node.id, {
                nodeId: node.id,
                status: "pending",
                startTime: Date.now()
            })
        }
    }

    /**
     * Mark a step as running
     */
    private markStepRunning(nodeId: string): void {
        const step = this.executionSteps.get(nodeId)
        if (step) {
            step.status = "running"
            step.startTime = Date.now()
        }
    }

    /**
     * Mark a step as completed
     */
    private markStepCompleted(nodeId: string, output: any): void {
        const step = this.executionSteps.get(nodeId)
        if (step) {
            step.status = "completed"
            step.endTime = Date.now()
            step.output = output
        }
    }

    /**
     * Mark a step as failed
     */
    private markStepFailed(nodeId: string, error: string): void {
        const step = this.executionSteps.get(nodeId)
        if (step) {
            step.status = "failed"
            step.endTime = Date.now()
            step.error = error
        }
    }

    /**
     * Execute a single node
     */
    private async executeNode(node: GraphNode, graph: AgentGraph, outputs: Record<string, any>): Promise<void> {
        this.markStepRunning(node.id)
        
        try {
            let result: any
            
            switch (node.type) {
                case "agent":
                    result = await this.executeAgentNode(node, outputs)
                    break
                case "workflow":
                    result = await this.executeWorkflowNode(node, graph, outputs)
                    break
                default:
                    throw new Error(`Unsupported node type: ${node.type}`)
            }
            
            outputs[node.id] = result
            this.markStepCompleted(node.id, result)
            
        } catch (error) {
            this.markStepFailed(node.id, error instanceof Error ? error.message : String(error))
            throw error
        }
    }

    /**
     * Execute an agent node
     */
    private async executeAgentNode(node: GraphNode, inputs: Record<string, any>): Promise<any> {
        // In a real implementation, this would delegate to the appropriate agent
        // For now, we'll simulate execution
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Return mock result
        return {
            nodeId: node.id,
            nodeName: node.name,
            result: `Executed agent node: ${node.name}`,
            timestamp: new Date().toISOString()
        }
    }

    /**
     * Execute a workflow node
     */
    private async executeWorkflowNode(node: GraphNode, graph: AgentGraph, inputs: Record<string, any>): Promise<any> {
        // In a real implementation, this would execute the embedded workflow
        // For now, we'll simulate execution
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 150))
        
        // Return mock result
        return {
            nodeId: node.id,
            nodeName: node.name,
            result: `Executed workflow node: ${node.name}`,
            timestamp: new Date().toISOString()
        }
    }

    /**
     * Topologically sort nodes for execution order
     */
    private topologicalSort(graph: AgentGraph): GraphNode[] {
        const sorted: GraphNode[] = []
        const visited = new Set<string>()
        const temp = new Set<string>()
        
        // Helper function for DFS
        const visit = (nodeId: string): void => {
            if (temp.has(nodeId)) {
                throw new Error(`Circular dependency detected involving node ${nodeId}`)
            }
            
            if (!visited.has(nodeId)) {
                temp.add(nodeId)
                
                // Find all nodes that depend on this node
                const dependents = graph.edges
                    .filter(edge => edge.sourceNodeId === nodeId)
                    .map(edge => edge.targetNodeId)
                
                for (const dependentId of dependents) {
                    visit(dependentId)
                }
                
                temp.delete(nodeId)
                visited.add(nodeId)
                const node = graph.nodes.find(n => n.id === nodeId)
                if (node) {
                    sorted.unshift(node)
                }
            }
        }
        
        // Visit all nodes
        for (const node of graph.nodes) {
            if (!visited.has(node.id)) {
                visit(node.id)
            }
        }
        
        return sorted
    }

    /**
     * Get execution status
     */
    public getExecutionStatus(): { isExecuting: boolean; steps: ExecutionStep[] } {
        return {
            isExecuting: this.isExecuting,
            steps: Array.from(this.executionSteps.values())
        }
    }

    /**
     * Cancel execution
     */
    public async cancelExecution(): Promise<void> {
        if (this.isExecuting) {
            this.isExecuting = false
            // In a real implementation, you would also cancel any running agents
        }
    }
}