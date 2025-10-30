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

import { ModelInfo, ModelSelectionCriteria } from "./types"

export interface LatencyOptimizationResult {
    model: ModelInfo
    estimatedLatency: number
    latencyImprovement: number
    confidence: number
}

export class LatencyOptimizer {
    /**
     * Optimize model selection based on latency while maintaining performance requirements
     */
    public static optimizeForLatency(
        models: ModelInfo[],
        criteria: ModelSelectionCriteria,
        maxLatency?: number
    ): LatencyOptimizationResult | null {
        if (models.length === 0) {
            return null
        }

        // Filter models by max latency if specified
        let eligibleModels = models
        if (maxLatency !== undefined) {
            eligibleModels = models.filter(model => 
                model.performance.latency <= maxLatency
            )
        }

        if (eligibleModels.length === 0) {
            return null
        }

        // Rank models by latency (lowest first)
        const rankedModels = this.rankByLatency(eligibleModels)

        // Select the fastest model that meets requirements
        const bestModel = rankedModels[0]
        if (!bestModel) {
            return null
        }
        
        const estimatedLatency = bestModel.performance.latency

        // Calculate potential improvement compared to the most accurate model
        const mostAccurateModels = this.rankByAccuracy(eligibleModels)
        const mostAccurateModel = mostAccurateModels[0]
        if (!mostAccurateModel) {
            return null
        }
        
        const baselineLatency = mostAccurateModel.performance.latency
        const latencyImprovement = baselineLatency - estimatedLatency

        return {
            model: bestModel,
            estimatedLatency,
            latencyImprovement,
            confidence: this.calculateConfidence(bestModel)
        }
    }

    /**
     * Rank models by latency (lower is better)
     */
    private static rankByLatency(models: ModelInfo[]): ModelInfo[] {
        return models.sort((a, b) => {
            // Lower latency is better
            return a.performance.latency - b.performance.latency
        })
    }

    /**
     * Rank models by accuracy
     */
    private static rankByAccuracy(models: ModelInfo[]): ModelInfo[] {
        return models.sort((a, b) => {
            // Higher accuracy is better
            return b.performance.accuracy - a.performance.accuracy
        })
    }

    /**
     * Calculate confidence in the model selection
     */
    private static calculateConfidence(model: ModelInfo): number {
        // Confidence is based on model reliability and recency of performance data
        const reliability = model.performance.reliability
        const daysSinceUpdate = (Date.now() - model.performance.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
        const recencyFactor = Math.max(0, 1 - (daysSinceUpdate / 30)) // Decrease confidence by 1% per day

        return reliability * recencyFactor
    }

    /**
     * Balance cost and latency optimization
     */
    public static balanceCostAndLatency(
        models: ModelInfo[],
        costWeight: number = 0.5,
        latencyWeight: number = 0.5
    ): ModelInfo[] {
        // Normalize cost and latency values
        const normalizedModels = this.normalizeMetrics(models)
        
        // Calculate weighted score for each model
        return normalizedModels.sort((a, b) => {
            const scoreA = this.calculateWeightedScore(a, costWeight, latencyWeight)
            const scoreB = this.calculateWeightedScore(b, costWeight, latencyWeight)
            
            // Lower score is better (better balance)
            return scoreA - scoreB
        })
    }

    /**
     * Normalize cost and latency metrics to 0-1 range
     */
    private static normalizeMetrics(models: ModelInfo[]): ModelInfo[] {
        if (models.length === 0) return []

        // Find min/max values for normalization
        const latencies = models.map(m => m.performance.latency)
        const minLatency = Math.min(...latencies)
        const maxLatency = Math.max(...latencies)

        // For cost, we need to estimate based on a standard task
        const costs = models.map(m => 
            (m.inputPrice || 0) * 1000 + (m.outputPrice || 0) * 500
        )
        const minCost = Math.min(...costs)
        const maxCost = Math.max(...costs)

        // Return models with normalized metrics
        return models.map(model => {
            const normalizedLatency = maxLatency > minLatency ? 
                (model.performance.latency - minLatency) / (maxLatency - minLatency) : 0
            
            const estimatedCost = (model.inputPrice || 0) * 1000 + (model.outputPrice || 0) * 500
            const normalizedCost = maxCost > minCost ? 
                (estimatedCost - minCost) / (maxCost - minCost) : 0

            // Return a new object with normalized metrics in metadata
            return {
                ...model,
                metadata: {
                    ...model.metadata,
                    normalizedLatency,
                    normalizedCost
                }
            }
        })
    }

    /**
     * Calculate weighted score for a model
     */
    private static calculateWeightedScore(
        model: ModelInfo & { metadata?: { normalizedLatency?: number, normalizedCost?: number } },
        costWeight: number,
        latencyWeight: number
    ): number {
        const normalizedLatency = model.metadata?.normalizedLatency || 0
        const normalizedCost = model.metadata?.normalizedCost || 0

        // Both latency and cost should be minimized, so lower values are better
        return (costWeight * normalizedCost) + (latencyWeight * normalizedLatency)
    }

    /**
     * Multi-objective optimization for cost, latency, and accuracy
     */
    public static multiObjectiveOptimization(
        models: ModelInfo[],
        weights: { cost: number; latency: number; accuracy: number }
    ): ModelInfo[] {
        // Normalize all metrics
        const normalizedModels = this.normalizeAllMetrics(models)
        
        // Calculate weighted score for each model
        return normalizedModels.sort((a, b) => {
            const scoreA = this.calculateMultiObjectiveScore(a, weights)
            const scoreB = this.calculateMultiObjectiveScore(b, weights)
            
            // Lower score is better
            return scoreA - scoreB
        })
    }

    /**
     * Normalize all metrics (cost, latency, accuracy) to 0-1 range
     */
    private static normalizeAllMetrics(models: ModelInfo[]): ModelInfo[] {
        if (models.length === 0) return []

        // Find min/max values for normalization
        const latencies = models.map(m => m.performance.latency)
        const minLatency = Math.min(...latencies)
        const maxLatency = Math.max(...latencies)

        const costs = models.map(m => 
            (m.inputPrice || 0) * 1000 + (m.outputPrice || 0) * 500
        )
        const minCost = Math.min(...costs)
        const maxCost = Math.max(...costs)

        const accuracies = models.map(m => m.performance.accuracy)
        const minAccuracy = Math.min(...accuracies)
        const maxAccuracy = Math.max(...accuracies)

        // Return models with normalized metrics
        return models.map(model => {
            const normalizedLatency = maxLatency > minLatency ? 
                (model.performance.latency - minLatency) / (maxLatency - minLatency) : 0
            
            const estimatedCost = (model.inputPrice || 0) * 1000 + (model.outputPrice || 0) * 500
            const normalizedCost = maxCost > minCost ? 
                (estimatedCost - minCost) / (maxCost - minCost) : 0

            const normalizedAccuracy = maxAccuracy > minAccuracy ? 
                (model.performance.accuracy - minAccuracy) / (maxAccuracy - minAccuracy) : 0

            // Return a new object with normalized metrics in metadata
            return {
                ...model,
                metadata: {
                    ...model.metadata,
                    normalizedLatency,
                    normalizedCost,
                    normalizedAccuracy
                }
            }
        })
    }

    /**
     * Calculate multi-objective score for a model
     */
    private static calculateMultiObjectiveScore(
        model: ModelInfo & { 
            metadata?: { 
                normalizedLatency?: number, 
                normalizedCost?: number, 
                normalizedAccuracy?: number 
            } 
        },
        weights: { cost: number; latency: number; accuracy: number }
    ): number {
        const normalizedLatency = model.metadata?.normalizedLatency || 0
        const normalizedCost = model.metadata?.normalizedCost || 0
        const normalizedAccuracy = model.metadata?.normalizedAccuracy || 0

        // For latency and cost, lower is better
        // For accuracy, higher is better, so we invert it
        return (weights.cost * normalizedCost) + 
               (weights.latency * normalizedLatency) + 
               (weights.accuracy * (1 - normalizedAccuracy))
    }
}