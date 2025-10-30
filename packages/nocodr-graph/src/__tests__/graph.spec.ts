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

import { describe, it, expect } from 'vitest'
import { AgentGraphManager } from '../AgentGraph'
import { GraphSerializer } from '../GraphSerializer'

describe('AgentGraph', () => {
    it('should create an empty graph', () => {
        const manager = new AgentGraphManager()
        const graph = manager.getGraph()
        
        expect(graph).toBeDefined()
        expect(graph.id).toBeDefined()
        expect(graph.name).toBe('New Agent Graph')
        expect(graph.nodes).toHaveLength(0)
        expect(graph.edges).toHaveLength(0)
    })

    it('should create agent nodes', () => {
        const manager = new AgentGraphManager()
        const node = manager.createAgentNode('Test Planner', 'planner', { x: 100, y: 100 })
        
        expect(node).toBeDefined()
        expect(node.type).toBe('agent')
        expect(node.agentType).toBe('planner')
        expect(node.name).toBe('Test Planner')
        expect(node.position.x).toBe(100)
        expect(node.position.y).toBe(100)
    })

    it('should create workflow nodes', () => {
        const manager = new AgentGraphManager()
        const node = manager.createWorkflowNode('Test Workflow', { x: 200, y: 200 })
        
        expect(node).toBeDefined()
        expect(node.type).toBe('workflow')
        expect(node.name).toBe('Test Workflow')
        expect(node.position.x).toBe(200)
        expect(node.position.y).toBe(200)
    })

    it('should add and remove edges', () => {
        const manager = new AgentGraphManager()
        const node1 = manager.createAgentNode('Source', 'coder', { x: 100, y: 100 })
        const node2 = manager.createAgentNode('Target', 'tester', { x: 300, y: 100 })
        
        const edge = manager.addEdge(node1.id, 'output1', node2.id, 'input1')
        
        expect(edge).toBeDefined()
        expect(edge.sourceNodeId).toBe(node1.id)
        expect(edge.targetNodeId).toBe(node2.id)
        
        // Test removal
        manager.removeEdge(edge.id)
        const graph = manager.getGraph()
        expect(graph.edges).toHaveLength(0)
    })

    it('should validate graph structure', () => {
        const manager = new AgentGraphManager()
        const result = manager.validate()
        
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })
})

describe('GraphSerializer', () => {
    it('should serialize and deserialize graphs', () => {
        const manager = new AgentGraphManager()
        manager.setName('Test Graph')
        manager.setDescription('A test graph for serialization')
        
        const node = manager.createAgentNode('Test Agent', 'coder', { x: 100, y: 100 })
        manager.addEdge(node.id, 'output1', node.id, 'input1') // Self-loop for testing
        
        const graph = manager.getGraph()
        const json = GraphSerializer.serializeToNFlow(graph)
        
        expect(json).toContain('"version": "1.0.0"')
        expect(json).toContain('"name": "Test Graph"')
        
        // Test deserialization
        const deserializedGraph = GraphSerializer.deserializeFromNFlow(json)
        expect(deserializedGraph.id).toBe(graph.id)
        expect(deserializedGraph.name).toBe('Test Graph')
        expect(deserializedGraph.description).toBe('A test graph for serialization')
    })

    it('should validate NFlow files', () => {
        const validJson = `{
            "version": "1.0.0",
            "graph": {
                "id": "test-graph",
                "name": "Test Graph",
                "version": "1.0.0",
                "nodes": [],
                "edges": [],
                "metadata": {},
                "createdAt": "2025-01-01T00:00:00.000Z",
                "updatedAt": "2025-01-01T00:00:00.000Z"
            },
            "metadata": {}
        }`
        
        const result = GraphSerializer.validateNFlow(validJson)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })
})