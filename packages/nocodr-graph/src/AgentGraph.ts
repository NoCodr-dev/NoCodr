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

import { 
    AgentGraph, 
    GraphNode, 
    GraphEdge, 
    AgentGraphNode, 
    WorkflowGraphNode,
    GraphExecutionResult
} from "./types"

export class AgentGraphManager {
    private graph: AgentGraph
    private nodes: Map<string, GraphNode> = new Map()
    private edges: Map<string, GraphEdge> = new Map()

    constructor(graph?: AgentGraph) {
        if (graph) {
            this.graph = graph
            this.initializeFromGraph(graph)
        } else {
            this.graph = this.createEmptyGraph()
        }
    }

    private createEmptyGraph(): AgentGraph {
        return {
            id: this.generateId(),
            name: "New Agent Graph",
            version: "1.0.0",
            nodes: [],
            edges: [],
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
        }
    }

    private initializeFromGraph(graph: AgentGraph): void {
        // Initialize nodes map
        for (const node of graph.nodes) {
            this.nodes.set(node.id, node)
        }
        
        // Initialize edges map
        for (const edge of graph.edges) {
            this.edges.set(edge.id, edge)
        }
    }

    /**
     * Create a new agent node
     */
    public createAgentNode(
        name: string,
        agentType: "planner" | "coder" | "debugger" | "tester" | "verifier",
        position: { x: number; y: number }
    ): AgentGraphNode {
        const node: AgentGraphNode = {
            id: this.generateId(),
            type: "agent",
            name,
            agentType,
            position,
            inputs: [],
            outputs: [],
            properties: {},
            capabilities: [],
            configuration: {}
        }
        
        this.nodes.set(node.id, node)
        this.graph.nodes.push(node)
        this.updateTimestamp()
        
        return node
    }

    /**
     * Create a new workflow node
     */
    public createWorkflowNode(
        name: string,
        position: { x: number; y: number }
    ): WorkflowGraphNode {
        const node: WorkflowGraphNode = {
            id: this.generateId(),
            type: "workflow",
            name,
            position,
            inputs: [],
            outputs: [],
            properties: {},
            steps: [],
            configuration: {}
        }
        
        this.nodes.set(node.id, node)
        this.graph.nodes.push(node)
        this.updateTimestamp()
        
        return node
    }

    /**
     * Add an edge between two nodes
     */
    public addEdge(
        sourceNodeId: string,
        sourceOutputId: string,
        targetNodeId: string,
        targetInputId: string
    ): GraphEdge {
        // Validate nodes exist
        if (!this.nodes.has(sourceNodeId)) {
            throw new Error(`Source node ${sourceNodeId} not found`)
        }
        
        if (!this.nodes.has(targetNodeId)) {
            throw new Error(`Target node ${targetNodeId} not found`)
        }

        const edge: GraphEdge = {
            id: this.generateId(),
            sourceNodeId,
            sourceOutputId,
            targetNodeId,
            targetInputId
        }
        
        this.edges.set(edge.id, edge)
        this.graph.edges.push(edge)
        this.updateTimestamp()
        
        return edge
    }

    /**
     * Remove a node and all connected edges
     */
    public removeNode(nodeId: string): void {
        const node = this.nodes.get(nodeId)
        if (!node) {
            throw new Error(`Node ${nodeId} not found`)
        }

        // Remove connected edges
        const edgesToRemove: string[] = []
        for (const edge of this.graph.edges) {
            if (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId) {
                edgesToRemove.push(edge.id)
            }
        }

        for (const edgeId of edgesToRemove) {
            this.removeEdge(edgeId)
        }

        // Remove node from graph
        this.graph.nodes = this.graph.nodes.filter(n => n.id !== nodeId)
        this.nodes.delete(nodeId)
        this.updateTimestamp()
    }

    /**
     * Remove an edge
     */
    public removeEdge(edgeId: string): void {
        const edge = this.edges.get(edgeId)
        if (!edge) {
            throw new Error(`Edge ${edgeId} not found`)
        }

        this.graph.edges = this.graph.edges.filter(e => e.id !== edgeId)
        this.edges.delete(edgeId)
        this.updateTimestamp()
    }

    /**
     * Update node properties
     */
    public updateNode(nodeId: string, properties: Partial<GraphNode>): void {
        const node = this.nodes.get(nodeId)
        if (!node) {
            throw new Error(`Node ${nodeId} not found`)
        }

        Object.assign(node, properties)
        this.updateTimestamp()
    }

    /**
     * Get the current graph
     */
    public getGraph(): AgentGraph {
        return { ...this.graph }
    }

    /**
     * Set the graph name
     */
    public setName(name: string): void {
        this.graph.name = name
        this.updateTimestamp()
    }

    /**
     * Set the graph description
     */
    public setDescription(description: string): void {
        this.graph.description = description
        this.updateTimestamp()
    }

    /**
     * Validate the graph structure
     */
    public validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        // Check for duplicate node IDs
        const nodeIds = new Set<string>()
        for (const node of this.graph.nodes) {
            if (nodeIds.has(node.id)) {
                errors.push(`Duplicate node ID: ${node.id}`)
            }
            nodeIds.add(node.id)
        }

        // Check for duplicate edge IDs
        const edgeIds = new Set<string>()
        for (const edge of this.graph.edges) {
            if (edgeIds.has(edge.id)) {
                errors.push(`Duplicate edge ID: ${edge.id}`)
            }
            edgeIds.add(edge.id)
        }

        // Check for invalid connections
        for (const edge of this.graph.edges) {
            if (!this.nodes.has(edge.sourceNodeId)) {
                errors.push(`Edge ${edge.id} references non-existent source node ${edge.sourceNodeId}`)
            }
            
            if (!this.nodes.has(edge.targetNodeId)) {
                errors.push(`Edge ${edge.id} references non-existent target node ${edge.targetNodeId}`)
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }

    private generateId(): string {
        return "node_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    }

    private updateTimestamp(): void {
        this.graph.updatedAt = new Date()
    }
}