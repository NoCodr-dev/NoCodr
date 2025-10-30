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

import { ModelInfo, ModelSelectionCriteria, RoutingDecision } from "./types"
import { ModelRegistry } from "./ModelRegistry"
import { CostOptimizer } from "./CostOptimizer"
import { LatencyOptimizer } from "./LatencyOptimizer"
import { FallbackRouter } from "./FallbackRouter"

export interface RoutingContext {
    criteria: ModelSelectionCriteria
    budget?: number
    maxLatency?: number
    optimizationStrategy?: "cost" | "latency" | "balanced" | "accuracy"
}

export class ModelRouter {
    private registry: ModelRegistry
    private fallbackRouter: FallbackRouter

    constructor(registry: ModelRegistry) {
        this.registry = registry
        this.fallbackRouter = new FallbackRouter(registry)
        // Initialize default fallback routes
        this.fallbackRouter.createDefaultFallbackRoutes()
    }

    /**
     * Select the best model based on routing context
     */
    public selectModel(context: RoutingContext): RoutingDecision {
        // Get candidate models based on criteria
        const candidates = this.getCandidateModels(context.criteria)
        
        if (candidates.length === 0) {
            return this.createErrorDecision("No models match the selection criteria")
        }

        // Apply optimization strategy
        let selectedModel: ModelInfo | undefined
        
        switch (context.optimizationStrategy) {
            case "cost":
                selectedModel = this.optimizeForCost(candidates, context)
                break
            case "latency":
                selectedModel = this.optimizeForLatency(candidates, context)
                break
            case "balanced":
                selectedModel = this.optimizeBalanced(candidates, context)
                break
            case "accuracy":
            default:
                selectedModel = this.optimizeForAccuracy(candidates)
                break
        }

        if (!selectedModel) {
            return this.createErrorDecision("Failed to select a model based on optimization strategy")
        }

        // Make final routing decision with fallback consideration
        return this.fallbackRouter.makeRoutingDecision(selectedModel, context.criteria)
    }

    /**
     * Get candidate models based on selection criteria
     */
    private getCandidateModels(criteria: ModelSelectionCriteria): ModelInfo[] {
        // Use the registry's built-in selection methods
        if (criteria.requiredCapabilities && criteria.requiredCapabilities.length > 0) {
            return this.registry.selectModels(criteria)
        }
        
        // If no specific capabilities required, get all models
        return this.registry.getAllModels()
    }

    /**
     * Optimize for cost efficiency
     */
    private optimizeForCost(candidates: ModelInfo[], context: RoutingContext): ModelInfo | undefined {
        const result = CostOptimizer.optimizeForCost(
            candidates, 
            context.criteria, 
            context.budget
        )
        
        return result?.model
    }

    /**
     * Optimize for low latency
     */
    private optimizeForLatency(candidates: ModelInfo[], context: RoutingContext): ModelInfo | undefined {
        const result = LatencyOptimizer.optimizeForLatency(
            candidates, 
            context.criteria, 
            context.maxLatency
        )
        
        return result?.model
    }

    /**
     * Optimize for accuracy (default)
     */
    private optimizeForAccuracy(candidates: ModelInfo[]): ModelInfo | undefined {
        // Sort by accuracy (highest first)
        const sorted = candidates.sort((a, b) => 
            b.performance.accuracy - a.performance.accuracy
        )
        
        return sorted[0]
    }

    /**
     * Optimize with balanced cost and latency
     */
    private optimizeBalanced(candidates: ModelInfo[], context: RoutingContext): ModelInfo | undefined {
        // Use latency optimizer's balanced approach
        const balanced = LatencyOptimizer.balanceCostAndLatency(candidates, 0.5, 0.5)
        return balanced[0]
    }

    /**
     * Create an error routing decision
     */
    private createErrorDecision(reason: string): RoutingDecision {
        return {
            modelId: "",
            providerId: "",
            reason,
            timestamp: new Date()
        }
    }

    /**
     * Record a routing failure for fallback learning
     */
    public recordFailure(modelId: string, providerId: string, reason: string): void {
        this.fallbackRouter.recordFailure({
            modelId,
            providerId,
            failureReason: reason,
            timestamp: new Date(),
            severity: "medium"
        })
    }

    /**
     * Get fallback router for external configuration
     */
    public getFallbackRouter(): FallbackRouter {
        return this.fallbackRouter
    }
}