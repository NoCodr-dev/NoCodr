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

import { AgentGraph, GraphNode, GraphEdge } from "./types"

export interface NFlowFile {
    version: string
    graph: AgentGraph
    metadata: Record<string, any>
}

export class GraphSerializer {
    /**
     * Serialize an agent graph to NFlow JSON format
     */
    public static serializeToNFlow(graph: AgentGraph): string {
        const nflow: NFlowFile = {
            version: "1.0.0",
            graph: {
                ...graph,
                createdAt: graph.createdAt,
                updatedAt: graph.updatedAt
            },
            metadata: {
                exporter: "NoCodr Graph Studio",
                exportDate: new Date().toISOString(),
                ...graph.metadata
            }
        }
        
        return JSON.stringify(nflow, null, 2)
    }

    /**
     * Deserialize NFlow JSON to an agent graph
     */
    public static deserializeFromNFlow(json: string): AgentGraph {
        const nflow: NFlowFile = JSON.parse(json)
        
        // Validate required fields
        if (!nflow.graph || !nflow.graph.id) {
            throw new Error("Invalid NFlow file: missing required graph fields")
        }
        
        // Convert date strings back to Date objects
        const graph: AgentGraph = {
            ...nflow.graph,
            createdAt: new Date(nflow.graph.createdAt),
            updatedAt: new Date(nflow.graph.updatedAt)
        }
        
        return graph
    }

    /**
     * Export graph to file
     */
    public static exportToFile(graph: AgentGraph, filename: string): void {
        const json = this.serializeToNFlow(graph)
        const blob = new Blob([json], { type: "application/json" })
        
        // Create download link
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename.endsWith(".nflow") ? filename : `${filename}.nflow`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    /**
     * Import graph from file
     */
    public static async importFromFile(file: File): Promise<AgentGraph> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            
            reader.onload = (event) => {
                try {
                    const json = event.target?.result as string
                    if (!json) {
                        throw new Error("Failed to read file")
                    }
                    
                    const graph = this.deserializeFromNFlow(json)
                    resolve(graph)
                } catch (error) {
                    reject(error)
                }
            }
            
            reader.onerror = () => {
                reject(new Error("Failed to read file"))
            }
            
            reader.readAsText(file)
        })
    }

    /**
     * Validate NFlow file structure
     */
    public static validateNFlow(json: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = []
        
        try {
            const nflow: NFlowFile = JSON.parse(json)
            
            // Check required fields
            if (!nflow.version) {
                errors.push("Missing version field")
            }
            
            if (!nflow.graph) {
                errors.push("Missing graph field")
            } else {
                if (!nflow.graph.id) {
                    errors.push("Missing graph.id field")
                }
                
                if (!nflow.graph.name) {
                    errors.push("Missing graph.name field")
                }
                
                if (!nflow.graph.version) {
                    errors.push("Missing graph.version field")
                }
                
                if (!nflow.graph.nodes) {
                    errors.push("Missing graph.nodes field")
                }
                
                if (!nflow.graph.edges) {
                    errors.push("Missing graph.edges field")
                }
                
                // Validate nodes
                if (nflow.graph.nodes) {
                    for (const node of nflow.graph.nodes) {
                        if (!node.id) {
                            errors.push("Node missing id field")
                        }
                        if (!node.type) {
                            errors.push(`Node ${node.id} missing type field`)
                        }
                        if (!node.name) {
                            errors.push(`Node ${node.id} missing name field`)
                        }
                        if (!node.position) {
                            errors.push(`Node ${node.id} missing position field`)
                        }
                        if (!node.inputs) {
                            errors.push(`Node ${node.id} missing inputs field`)
                        }
                        if (!node.outputs) {
                            errors.push(`Node ${node.id} missing outputs field`)
                        }
                        if (!node.properties) {
                            errors.push(`Node ${node.id} missing properties field`)
                        }
                    }
                }
                
                // Validate edges
                if (nflow.graph.edges) {
                    for (const edge of nflow.graph.edges) {
                        if (!edge.id) {
                            errors.push("Edge missing id field")
                        }
                        if (!edge.sourceNodeId) {
                            errors.push(`Edge ${edge.id} missing sourceNodeId field`)
                        }
                        if (!edge.sourceOutputId) {
                            errors.push(`Edge ${edge.id} missing sourceOutputId field`)
                        }
                        if (!edge.targetNodeId) {
                            errors.push(`Edge ${edge.id} missing targetNodeId field`)
                        }
                        if (!edge.targetInputId) {
                            errors.push(`Edge ${edge.id} missing targetInputId field`)
                        }
                    }
                }
            }
            
        } catch (error) {
            errors.push(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
        }
        
        return {
            isValid: errors.length === 0,
            errors
        }
    }
}