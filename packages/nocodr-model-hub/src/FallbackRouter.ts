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

import { ModelInfo, ModelProvider, RoutingDecision } from "./types"
import { ModelRegistry } from "./ModelRegistry"

export interface FallbackRoute {
    modelId: string
    providerId: string
    priority: number // Lower number means higher priority
    conditions: FallbackConditions
}

export interface FallbackConditions {
    maxFailures?: number
    maxLatency?: number
    minAccuracy?: number
    providerStatus?: "healthy" | "degraded" | "unavailable"
}

export interface RouteFailure {
    modelId: string
    providerId: string
    failureReason: string
    timestamp: Date
    severity: "low" | "medium" | "high"
}

export class FallbackRouter {
    private registry: ModelRegistry
    private fallbackRoutes: FallbackRoute[] = []
    private failureHistory: RouteFailure[] = []
    private providerHealth: Map<string, { status: "healthy" | "degraded" | "unavailable", failureCount: number }> = new Map()

    constructor(registry: ModelRegistry) {
        this.registry = registry
    }

    /**
     * Add a fallback route
     */
    public addFallbackRoute(route: FallbackRoute): void {
        this.fallbackRoutes.push(route)
        // Sort by priority (lowest first)
        this.fallbackRoutes.sort((a, b) => a.priority - b.priority)
    }

    /**
     * Get fallback routes for a failed model
     */
    public getFallbackRoutes(failedModelId: string, failedProviderId: string): ModelInfo[] {
        const failedModel = this.registry.getModel(failedModelId)
        if (!failedModel) {
            return []
        }

        const fallbackModels: ModelInfo[] = []
        
        for (const route of this.fallbackRoutes) {
            // Skip if this is the failed model
            if (route.modelId === failedModelId && route.providerId === failedProviderId) {
                continue
            }

            // Check if conditions are met
            if (this.checkFallbackConditions(route)) {
                const model = this.registry.getModel(route.modelId)
                if (model) {
                    fallbackModels.push(model)
                }
            }
        }

        return fallbackModels
    }

    /**
     * Check if fallback conditions are met
     */
    private checkFallbackConditions(route: FallbackRoute): boolean {
        const conditions = route.conditions

        // Check provider health status
        if (conditions.providerStatus) {
            const providerHealth = this.providerHealth.get(route.providerId)
            if (providerHealth && providerHealth.status !== conditions.providerStatus) {
                return false
            }
        }

        // Check failure count
        if (conditions.maxFailures !== undefined) {
            const providerHealth = this.providerHealth.get(route.providerId)
            if (providerHealth && providerHealth.failureCount > conditions.maxFailures) {
                return false
            }
        }

        // Other conditions could be added here
        return true
    }

    /**
     * Record a route failure
     */
    public recordFailure(failure: RouteFailure): void {
        this.failureHistory.push(failure)
        
        // Update provider health
        const providerId = failure.providerId
        const currentHealth = this.providerHealth.get(providerId) || { 
            status: "healthy", 
            failureCount: 0 
        }
        
        currentHealth.failureCount += 1
        
        // Update status based on failure count
        if (currentHealth.failureCount > 10) {
            currentHealth.status = "unavailable"
        } else if (currentHealth.failureCount > 5) {
            currentHealth.status = "degraded"
        }
        
        this.providerHealth.set(providerId, currentHealth)
        
        // Keep only recent failures (last 24 hours)
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000)
        this.failureHistory = this.failureHistory.filter(
            f => f.timestamp.getTime() > cutoffTime
        )
    }

    /**
     * Get provider health status
     */
    public getProviderHealth(providerId: string): { status: "healthy" | "degraded" | "unavailable", failureCount: number } {
        return this.providerHealth.get(providerId) || { status: "healthy", failureCount: 0 }
    }

    /**
     * Reset provider health status
     */
    public resetProviderHealth(providerId: string): void {
        this.providerHealth.delete(providerId)
    }

    /**
     * Create default fallback routes for all providers
     */
    public createDefaultFallbackRoutes(): void {
        // Clear existing routes
        this.fallbackRoutes = []
        
        // Get all providers
        const providers = this.registry.getAllProviders()
        
        // Create fallback routes prioritizing major providers
        const majorProviders = ["openai", "anthropic", "google"]
        const otherProviders = providers
            .map(p => p.id)
            .filter(id => !majorProviders.includes(id))
        
        // Priority 1: Major providers (OpenAI, Anthropic, Google)
        majorProviders.forEach((providerId, index) => {
            if (providers.some(p => p.id === providerId)) {
                this.addFallbackRoute({
                    modelId: this.getDefaultModelForProvider(providerId),
                    providerId,
                    priority: index + 1,
                    conditions: {
                        providerStatus: "healthy"
                    }
                })
            }
        })
        
        // Priority 2: Other providers
        otherProviders.forEach((providerId, index) => {
            this.addFallbackRoute({
                modelId: this.getDefaultModelForProvider(providerId),
                providerId,
                priority: majorProviders.length + index + 1,
                conditions: {
                    providerStatus: "healthy"
                }
            })
        })
    }

    /**
     * Get default model for a provider
     */
    private getDefaultModelForProvider(providerId: string): string {
        const models = this.registry.getModelsByProvider(providerId)
        if (models.length === 0) {
            return ""
        }
        
        // Return the first model (assuming it's the default/preferred one)
        return models[0]?.id || ""
    }

    /**
     * Make a routing decision with fallback consideration
     */
    public makeRoutingDecision(
        primaryModel: ModelInfo,
        criteria: any
    ): RoutingDecision {
        // Check if primary model is healthy
        const providerHealth = this.getProviderHealth(primaryModel.provider)
        
        if (providerHealth.status === "unavailable") {
            // Try to find a fallback
            const fallbacks = this.getFallbackRoutes(primaryModel.id, primaryModel.provider)
            if (fallbacks.length > 0) {
                const fallbackModel = fallbacks[0]
                if (fallbackModel) {
                    return {
                        modelId: fallbackModel.id,
                        providerId: fallbackModel.provider,
                        reason: `Primary provider ${primaryModel.provider} is unavailable, using fallback`,
                        timestamp: new Date()
                    }
                }
            }
        }
        
        // Use primary model if no fallback needed or available
        return {
            modelId: primaryModel.id,
            providerId: primaryModel.provider,
            reason: "Primary model selected",
            timestamp: new Date()
        }
    }

    /**
     * Intelligent fallback selection based on multiple factors
     */
    public selectIntelligentFallback(
        failedModel: ModelInfo,
        context: { taskType?: string; requiredCapabilities?: string[]; budget?: number }
    ): ModelInfo | null {
        // Get all potential fallbacks
        const fallbacks = this.getFallbackRoutes(failedModel.id, failedModel.provider)
        
        if (fallbacks.length === 0) {
            return null
        }

        // Filter by required capabilities if specified
        let filteredFallbacks = fallbacks
        if (context.requiredCapabilities && context.requiredCapabilities.length > 0) {
            filteredFallbacks = fallbacks.filter(model =>
                context.requiredCapabilities?.every(cap => 
                    model.capabilities[cap as keyof typeof model.capabilities] === true
                )
            )
        }

        // Filter by budget if specified
        if (context.budget !== undefined) {
            filteredFallbacks = filteredFallbacks.filter(model => {
                // Simple cost estimation
                const estimatedCost = (model.inputPrice || 0) * 1000 + (model.outputPrice || 0) * 500
                return estimatedCost <= context.budget!
            })
        }

        if (filteredFallbacks.length === 0) {
            return null
        }

        // Rank fallbacks by a combination of factors:
        // 1. Provider health (healthy > degraded > unavailable)
        // 2. Model accuracy
        // 3. Cost efficiency
        // 4. Latency

        const rankedFallbacks = filteredFallbacks.sort((a, b) => {
            // Provider health check
            const healthA = this.getProviderHealth(a.provider)
            const healthB = this.getProviderHealth(b.provider)
            
            const healthScoreA = healthA.status === "healthy" ? 2 : healthA.status === "degraded" ? 1 : 0
            const healthScoreB = healthB.status === "healthy" ? 2 : healthB.status === "degraded" ? 1 : 0
            
            if (healthScoreA !== healthScoreB) {
                return healthScoreB - healthScoreA // Higher health score is better
            }

            // Accuracy check
            if (b.performance.accuracy !== a.performance.accuracy) {
                return b.performance.accuracy - a.performance.accuracy // Higher accuracy is better
            }

            // Cost efficiency check
            if (b.performance.costEfficiency !== a.performance.costEfficiency) {
                return b.performance.costEfficiency - a.performance.costEfficiency // Higher cost efficiency is better
            }

            // Latency check
            return a.performance.latency - b.performance.latency // Lower latency is better
        })

        return rankedFallbacks[0] || null
    }

    /**
     * Get fallback statistics
     */
    public getStatistics(): {
        totalRoutes: number
        healthyProviders: number
        degradedProviders: number
        unavailableProviders: number
        recentFailures: number
    } {
        const healthyProviders = Array.from(this.providerHealth.values())
            .filter(health => health.status === "healthy").length
        
        const degradedProviders = Array.from(this.providerHealth.values())
            .filter(health => health.status === "degraded").length
            
        const unavailableProviders = Array.from(this.providerHealth.values())
            .filter(health => health.status === "unavailable").length
            
        const recentFailures = this.failureHistory.length

        return {
            totalRoutes: this.fallbackRoutes.length,
            healthyProviders,
            degradedProviders,
            unavailableProviders,
            recentFailures
        }
    }

    /**
     * Add a custom fallback route with advanced conditions
     */
    public addAdvancedFallbackRoute(route: FallbackRoute & { 
        customCondition?: (model: ModelInfo) => boolean 
    }): void {
        this.addFallbackRoute(route)
    }
}