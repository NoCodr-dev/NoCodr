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

/**
 * Example usage of the NoCodr Graph Studio
 * 
 * This example demonstrates how to create, edit, and execute agent graphs
 * using the visual workflow editor.
 */

import { AgentGraphManager } from "./AgentGraph"
import { GraphEditor } from "./GraphEditor"
import { GraphSerializer } from "./GraphSerializer"

// Example 1: Basic graph creation
function createBasicGraph(): void {
    console.log("=== Creating Basic Agent Graph ===")
    
    const graphManager = new AgentGraphManager()
    graphManager.setName("Sample Workflow")
    graphManager.setDescription("A simple workflow demonstrating agent collaboration")
    
    // Create agent nodes
    const planner = graphManager.createAgentNode("Task Planner", "planner", { x: 100, y: 100 })
    const coder = graphManager.createAgentNode("Code Generator", "coder", { x: 300, y: 100 })
    const tester = graphManager.createAgentNode("Code Tester", "tester", { x: 500, y: 100 })
    const debuggerAgent = graphManager.createAgentNode("Code Debugger", "debugger", { x: 300, y: 250 })
    
    // Create connections
    graphManager.addEdge(planner.id, "planOutput", coder.id, "planInput")
    graphManager.addEdge(coder.id, "codeOutput", tester.id, "codeInput")
    graphManager.addEdge(tester.id, "testResults", debuggerAgent.id, "testInput")
    graphManager.addEdge(debuggerAgent.id, "fixedCode", coder.id, "codeInput")
    
    // Validate the graph
    const validation = graphManager.validate()
    console.log("Graph validation:", validation)
    
    // Export to NFlow format
    const nflowJson = GraphSerializer.serializeToNFlow(graphManager.getGraph())
    console.log("NFlow JSON:", nflowJson.substring(0, 200) + "...")
}

// Example 2: Visual editor setup (browser environment)
function setupVisualEditor(): void {
    console.log("=== Setting up Visual Editor ===")
    
    // This would run in a browser environment
    // const container = document.getElementById('graph-editor-container')
    // if (container) {
    //     const editor = new GraphEditor({
    //         container,
    //         width: 800,
    //         height: 600,
    //         gridSize: 20,
    //         snapToGrid: true
    //     })
    //     
    //     // Create some initial nodes
    //     editor.createAgentNode("Planner", "planner", { x: 100, y: 100 })
    //     editor.createAgentNode("Coder", "coder", { x: 300, y: 100 })
    //     
    //     console.log("Visual editor initialized")
    // }
}

// Example 3: Graph manipulation
function demonstrateGraphManipulation(): void {
    console.log("=== Demonstrating Graph Manipulation ===")
    
    const graphManager = new AgentGraphManager()
    
    // Create nodes
    const node1 = graphManager.createAgentNode("Agent 1", "planner", { x: 100, y: 100 })
    const node2 = graphManager.createAgentNode("Agent 2", "coder", { x: 300, y: 100 })
    
    console.log("Created nodes:", node1.name, "and", node2.name)
    
    // Add edge
    const edge = graphManager.addEdge(node1.id, "output1", node2.id, "input1")
    console.log("Created edge:", edge.id)
    
    // Update node properties
    graphManager.updateNode(node1.id, {
        name: "Updated Planner",
        description: "This is an updated planner agent"
    })
    
    const nodes = graphManager.getGraph().nodes
    if (nodes.length > 0) {
        console.log("Updated node name:", nodes[0]?.name)
    }
    
    // Remove edge
    graphManager.removeEdge(edge.id)
    console.log("Remaining edges:", graphManager.getGraph().edges.length)
    
    // Remove node (this will also remove connected edges)
    graphManager.removeNode(node2.id)
    console.log("Remaining nodes:", graphManager.getGraph().nodes.length)
}

// Run examples
function runExamples(): void {
    try {
        createBasicGraph()
        console.log()
        
        setupVisualEditor()
        console.log()
        
        demonstrateGraphManipulation()
        console.log()
        
        console.log("=== All examples completed successfully ===")
    } catch (error) {
        console.error("Error running examples:", error)
    }
}

// Export for use in other modules
export { 
    createBasicGraph,
    setupVisualEditor,
    demonstrateGraphManipulation,
    runExamples
}

// Run examples if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    runExamples()
}