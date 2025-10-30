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

import { AgentGraphManager } from "./AgentGraph"
import { 
    GraphNode, 
    GraphEdge, 
    AgentGraphNode, 
    WorkflowGraphNode,
    AgentGraph
} from "./types"

export interface GraphEditorOptions {
    container?: HTMLElement
    width?: number
    height?: number
    gridSize?: number
    snapToGrid?: boolean
}

export class GraphEditor {
    private agentGraphManager: AgentGraphManager
    private options: GraphEditorOptions
    private container: HTMLElement | null = null
    private canvas: HTMLCanvasElement | null = null
    private ctx: CanvasRenderingContext2D | null = null
    private selectedNode: string | null = null
    private dragOffset: { x: number; y: number } | null = null

    constructor(options: GraphEditorOptions = {}) {
        this.options = {
            width: 800,
            height: 600,
            gridSize: 20,
            snapToGrid: true,
            ...options
        }
        
        this.agentGraphManager = new AgentGraphManager()
        
        if (this.options.container) {
            this.container = this.options.container
            this.initializeCanvas()
        }
    }

    /**
     * Initialize the canvas for rendering
     */
    private initializeCanvas(): void {
        if (!this.container) return
        
        this.canvas = document.createElement('canvas')
        this.canvas.width = this.options.width || 800
        this.canvas.height = this.options.height || 600
        this.canvas.style.border = '1px solid #ccc'
        
        this.ctx = this.canvas.getContext('2d')
        if (!this.ctx) {
            throw new Error('Failed to get 2D context')
        }
        
        this.container.appendChild(this.canvas)
        this.setupEventListeners()
        this.render()
    }

    /**
     * Setup event listeners for interaction
     */
    private setupEventListeners(): void {
        if (!this.canvas) return
        
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this))
    }

    /**
     * Handle mouse down events
     */
    private handleMouseDown(event: MouseEvent): void {
        if (!this.canvas) return
        
        const rect = this.canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        
        // Check if clicking on a node
        const clickedNode = this.getNodeAtPosition(x, y)
        if (clickedNode) {
            this.selectedNode = clickedNode.id
            this.dragOffset = {
                x: x - clickedNode.position.x,
                y: y - clickedNode.position.y
            }
        } else {
            this.selectedNode = null
        }
        
        this.render()
    }

    /**
     * Handle mouse move events
     */
    private handleMouseMove(event: MouseEvent): void {
        if (!this.canvas || !this.selectedNode || !this.dragOffset) return
        
        const rect = this.canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        
        const node = this.getNodeById(this.selectedNode)
        if (node) {
            let newX = x - this.dragOffset.x
            let newY = y - this.dragOffset.y
            
            // Snap to grid if enabled
            if (this.options.snapToGrid && this.options.gridSize) {
                newX = Math.round(newX / this.options.gridSize) * this.options.gridSize
                newY = Math.round(newY / this.options.gridSize) * this.options.gridSize
            }
            
            node.position.x = newX
            node.position.y = newY
            
            this.agentGraphManager.updateNode(node.id, node)
            this.render()
        }
    }

    /**
     * Handle mouse up events
     */
    private handleMouseUp(event: MouseEvent): void {
        this.dragOffset = null
    }

    /**
     * Handle double click events
     */
    private handleDoubleClick(event: MouseEvent): void {
        if (!this.canvas) return
        
        const rect = this.canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        
        // Create a new agent node at double-click position
        const snappedX = this.options.snapToGrid && this.options.gridSize 
            ? Math.round(x / this.options.gridSize) * this.options.gridSize 
            : x
        const snappedY = this.options.snapToGrid && this.options.gridSize 
            ? Math.round(y / this.options.gridSize) * this.options.gridSize 
            : y
            
        this.createAgentNode("New Agent", "coder", { x: snappedX, y: snappedY })
    }

    /**
     * Create a new agent node
     */
    public createAgentNode(
        name: string,
        agentType: "planner" | "coder" | "debugger" | "tester" | "verifier",
        position: { x: number; y: number }
    ): AgentGraphNode {
        const node = this.agentGraphManager.createAgentNode(name, agentType, position)
        this.render()
        return node
    }

    /**
     * Create a new workflow node
     */
    public createWorkflowNode(
        name: string,
        position: { x: number; y: number }
    ): WorkflowGraphNode {
        const node = this.agentGraphManager.createWorkflowNode(name, position)
        this.render()
        return node
    }

    /**
     * Add an edge between nodes
     */
    public addEdge(
        sourceNodeId: string,
        sourceOutputId: string,
        targetNodeId: string,
        targetInputId: string
    ): void {
        this.agentGraphManager.addEdge(sourceNodeId, sourceOutputId, targetNodeId, targetInputId)
        this.render()
    }

    /**
     * Remove a node
     */
    public removeNode(nodeId: string): void {
        this.agentGraphManager.removeNode(nodeId)
        if (this.selectedNode === nodeId) {
            this.selectedNode = null
        }
        this.render()
    }

    /**
     * Render the graph
     */
    public render(): void {
        if (!this.ctx || !this.canvas) return
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        
        // Draw grid
        this.drawGrid()
        
        // Draw edges
        this.drawEdges()
        
        // Draw nodes
        this.drawNodes()
    }

    /**
     * Draw the grid
     */
    private drawGrid(): void {
        if (!this.ctx || !this.options.gridSize) return
        
        const gridSize = this.options.gridSize
        const width = this.options.width || 800
        const height = this.options.height || 600
        
        this.ctx.strokeStyle = '#f0f0f0'
        this.ctx.lineWidth = 1
        
        // Vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            this.ctx.beginPath()
            this.ctx.moveTo(x, 0)
            this.ctx.lineTo(x, height)
            this.ctx.stroke()
        }
        
        // Horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            this.ctx.beginPath()
            this.ctx.moveTo(0, y)
            this.ctx.lineTo(width, y)
            this.ctx.stroke()
        }
    }

    /**
     * Draw nodes
     */
    private drawNodes(): void {
        const graph = this.agentGraphManager.getGraph()
        
        for (const node of graph.nodes) {
            this.drawNode(node)
        }
    }

    /**
     * Draw a single node
     */
    private drawNode(node: GraphNode): void {
        if (!this.ctx) return
        
        const isSelected = this.selectedNode === node.id
        const width = 120
        const height = 60
        
        // Node background
        this.ctx.fillStyle = isSelected ? '#4a90e2' : '#f0f0f0'
        this.ctx.fillRect(node.position.x, node.position.y, width, height)
        
        // Node border
        this.ctx.strokeStyle = isSelected ? '#2c5aa0' : '#ccc'
        this.ctx.lineWidth = isSelected ? 2 : 1
        this.ctx.strokeRect(node.position.x, node.position.y, width, height)
        
        // Node text
        this.ctx.fillStyle = isSelected ? '#ffffff' : '#333333'
        this.ctx.font = '12px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(
            node.name,
            node.position.x + width / 2,
            node.position.y + height / 2 + 4
        )
        
        // Node type indicator
        this.ctx.font = '10px Arial'
        this.ctx.fillText(
            node.type,
            node.position.x + width / 2,
            node.position.y + height / 2 + 18
        )
    }

    /**
     * Draw edges
     */
    private drawEdges(): void {
        if (!this.ctx) return
        
        const graph = this.agentGraphManager.getGraph()
        
        this.ctx.strokeStyle = '#999999'
        this.ctx.lineWidth = 2
        
        for (const edge of graph.edges) {
            const sourceNode = this.getNodeById(edge.sourceNodeId)
            const targetNode = this.getNodeById(edge.targetNodeId)
            
            if (sourceNode && targetNode) {
                this.ctx.beginPath()
                this.ctx.moveTo(
                    sourceNode.position.x + 60, // Center of node
                    sourceNode.position.y + 30
                )
                this.ctx.lineTo(
                    targetNode.position.x + 60, // Center of node
                    targetNode.position.y + 30
                )
                this.ctx.stroke()
                
                // Draw arrowhead
                this.drawArrowhead(
                    sourceNode.position.x + 60,
                    sourceNode.position.y + 30,
                    targetNode.position.x + 60,
                    targetNode.position.y + 30
                )
            }
        }
    }

    /**
     * Draw arrowhead for edges
     */
    private drawArrowhead(fromX: number, fromY: number, toX: number, toY: number): void {
        if (!this.ctx) return
        
        const angle = Math.atan2(toY - fromY, toX - fromX)
        const headLength = 10
        
        this.ctx.beginPath()
        this.ctx.moveTo(toX, toY)
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        )
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        )
        this.ctx.closePath()
        this.ctx.fillStyle = '#999999'
        this.ctx.fill()
    }

    /**
     * Get node at position
     */
    private getNodeAtPosition(x: number, y: number): GraphNode | null {
        const graph = this.agentGraphManager.getGraph()
        const width = 120
        const height = 60
        
        // Check nodes in reverse order (topmost first)
        for (let i = graph.nodes.length - 1; i >= 0; i--) {
            const node = graph.nodes[i]
            if (node &&
                x >= node.position.x &&
                x <= node.position.x + width &&
                y >= node.position.y &&
                y <= node.position.y + height
            ) {
                return node
            }
        }
        
        return null
    }

    /**
     * Get node by ID
     */
    private getNodeById(nodeId: string): GraphNode | null {
        const graph = this.agentGraphManager.getGraph()
        return graph.nodes.find(node => node.id === nodeId) ?? null
    }

    /**
     * Get the current graph
     */
    public getGraph(): AgentGraph {
        return this.agentGraphManager.getGraph()
    }

    /**
     * Load a graph
     */
    public loadGraph(graph: AgentGraph): void {
        // In a real implementation, this would recreate the graph manager with the loaded graph
        // For now, we'll just update the name and description as an example
        this.agentGraphManager.setName(graph.name)
        if (graph.description) {
            this.agentGraphManager.setDescription(graph.description)
        }
        this.render()
    }

    /**
     * Set container for rendering
     */
    public setContainer(container: HTMLElement): void {
        this.container = container
        this.initializeCanvas()
    }
}