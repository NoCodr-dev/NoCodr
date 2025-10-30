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

import { ModelInfo, ModelProvider, ModelSelectionCriteria, RoutingDecision } from "./types"
import { ModelRegistry } from "./ModelRegistry"
import { ModelAdapter } from "./ModelAdapter"
import { ModelRouter, RoutingContext } from "./ModelRouter"
import { CostOptimizer } from "./CostOptimizer"
import { LatencyOptimizer } from "./LatencyOptimizer"
import { FallbackRouter } from "./FallbackRouter"

export interface ModelHubConfig {
    populateWithPopularModels?: boolean
}

export class ModelHub {
    private registry: ModelRegistry
    private router: ModelRouter
    private adapters: Map<string, ModelAdapter> = new Map()

    constructor(config?: ModelHubConfig) {
        this.registry = new ModelRegistry()
        this.router = new ModelRouter(this.registry)
        
        // Populate with popular models if requested
        if (config?.populateWithPopularModels !== false) {
            this.registry.populateWithPopularModels()
        }
    }

    /**
     * Register a model in the hub
     */
    public registerModel(model: ModelInfo): void {
        this.registry.registerModel(model)
    }

    /**
     * Register a provider and all its models
     */
    public registerProvider(provider: ModelProvider): void {
        this.registry.registerProvider(provider)
    }

    /**
     * Get a model by ID or alias
     */
    public getModel(modelId: string): ModelInfo | undefined {
        return this.registry.getModel(modelId)
    }

    /**
     * Get all registered models
     */
    public getAllModels(): ModelInfo[] {
        return this.registry.getAllModels()
    }

    /**
     * Get models by provider
     */
    public getModelsByProvider(providerId: string): ModelInfo[] {
        return this.registry.getModelsByProvider(providerId)
    }

    /**
     * Select the best model based on criteria
     */
    public selectModel(criteria: ModelSelectionCriteria): ModelInfo | undefined {
        return this.registry.selectModel(criteria)
    }

    /**
     * Select multiple models based on criteria
     */
    public selectModels(criteria: ModelSelectionCriteria, limit: number = 5): ModelInfo[] {
        return this.registry.selectModels(criteria, limit)
    }

    /**
     * Route to the best model based on context
     */
    public routeModel(context: RoutingContext): RoutingDecision {
        return this.router.selectModel(context)
    }

    /**
     * Create and register a model adapter
     */
    public createAdapter(config: any): ModelAdapter {
        // Determine adapter type based on provider
        const provider = config.provider?.toLowerCase()
        
        let adapter: ModelAdapter
        switch (provider) {
            case "openai":
                adapter = ModelAdapter.createOpenAIAdapter(config)
                break
            case "anthropic":
                adapter = ModelAdapter.createAnthropicAdapter(config)
                break
            case "google":
                adapter = ModelAdapter.createGoogleAdapter(config)
                break
            case "mistral":
                adapter = ModelAdapter.createMistralAdapter(config)
                break
            case "deepseek":
                adapter = ModelAdapter.createDeepSeekAdapter(config)
                break
            default:
                adapter = new ModelAdapter(config)
                break
        }
        
        // Store adapter for later use
        this.adapters.set(provider, adapter)
        return adapter
    }

    /**
     * Get an existing adapter
     */
    public getAdapter(providerId: string): ModelAdapter | undefined {
        return this.adapters.get(providerId.toLowerCase())
    }

    /**
     * Optimize model selection for cost
     */
    public optimizeForCost(
        criteria: ModelSelectionCriteria,
        budget?: number
    ): ModelInfo | undefined {
        const models = this.registry.selectModels(criteria)
        const result = CostOptimizer.optimizeForCost(models, criteria, budget)
        return result?.model
    }

    /**
     * Optimize model selection for latency
     */
    public optimizeForLatency(
        criteria: ModelSelectionCriteria,
        maxLatency?: number
    ): ModelInfo | undefined {
        const models = this.registry.selectModels(criteria)
        const result = LatencyOptimizer.optimizeForLatency(models, criteria, maxLatency)
        return result?.model
    }

    /**
     * Balance cost and latency optimization
     */
    public balanceCostAndLatency(
        criteria: ModelSelectionCriteria,
        costWeight: number = 0.5,
        latencyWeight: number = 0.5
    ): ModelInfo[] {
        const models = this.registry.selectModels(criteria)
        return LatencyOptimizer.balanceCostAndLatency(models, costWeight, latencyWeight)
    }

    /**
     * Get cost optimization information
     */
    public getCostOptimizationInfo(
        model: ModelInfo,
        criteria: ModelSelectionCriteria
    ): any {
        const estimatedCost = CostOptimizer.estimateModelCost(model, criteria)
        const alternatives = CostOptimizer.findAlternatives(model, this.getAllModels())
        
        return {
            estimatedCost,
            alternatives
        }
    }

    /**
     * Record a routing failure
     */
    public recordRoutingFailure(modelId: string, providerId: string, reason: string): void {
        // This would typically be called by the runtime when a model call fails
        this.router.recordFailure(modelId, providerId, reason)
    }

    /**
     * Get model registry statistics
     */
    public getStatistics(): { modelCount: number; providerCount: number } {
        return {
            modelCount: this.registry.getModelCount(),
            providerCount: this.registry.getProviderCount()
        }
    }

    /**
     * Get fallback router for advanced configuration
     */
    public getFallbackRouter(): FallbackRouter {
        return this.router.getFallbackRouter()
    }
}