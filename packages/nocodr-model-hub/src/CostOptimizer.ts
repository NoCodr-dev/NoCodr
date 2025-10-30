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

export interface CostOptimizationResult {
    model: ModelInfo
    estimatedCost: number
    costSavings: number
    confidence: number
}

export class CostOptimizer {
    /**
     * Optimize model selection based on cost while maintaining performance requirements
     */
    public static optimizeForCost(
        models: ModelInfo[],
        criteria: ModelSelectionCriteria,
        budget?: number
    ): CostOptimizationResult | null {
        if (models.length === 0) {
            return null
        }

        // Filter models by budget if specified
        let eligibleModels = models
        if (budget !== undefined) {
            eligibleModels = models.filter(model => {
                const estimatedCost = this.estimateModelCost(model, criteria)
                return estimatedCost <= budget
            })
        }

        if (eligibleModels.length === 0) {
            return null
        }

        // Rank models by cost efficiency
        const rankedModels = this.rankByCostEfficiency(eligibleModels)

        // Select the most cost-efficient model that meets requirements
        const bestModel = rankedModels[0]
        if (!bestModel) {
            return null
        }
        
        const estimatedCost = this.estimateModelCost(bestModel, criteria)

        // Calculate potential savings compared to the most accurate model
        const mostAccurateModels = this.rankByAccuracy(eligibleModels)
        const mostAccurateModel = mostAccurateModels[0]
        if (!mostAccurateModel) {
            return null
        }
        
        const baselineCost = this.estimateModelCost(mostAccurateModel, criteria)
        const costSavings = baselineCost - estimatedCost

        return {
            model: bestModel,
            estimatedCost,
            costSavings,
            confidence: this.calculateConfidence(bestModel)
        }
    }

    /**
     * Estimate the cost of using a model for a given task
     */
    public static estimateModelCost(model: ModelInfo, criteria: ModelSelectionCriteria): number {
        // This is a simplified cost estimation
        // In practice, this would consider:
        // - Input/output token counts
        // - Model pricing
        // - Cache usage
        // - Request frequency

        const inputTokens = criteria.contextSize || 1000
        const outputTokens = 500 // Assumed average output size

        const inputCost = (inputTokens / 1000) * (model.inputPrice || 0)
        const outputCost = (outputTokens / 1000) * (model.outputPrice || 0)

        return inputCost + outputCost
    }

    /**
     * Rank models by cost efficiency (lower cost per unit of performance)
     */
    private static rankByCostEfficiency(models: ModelInfo[]): ModelInfo[] {
        return models.sort((a, b) => {
            const costEfficiencyA = a.performance.costEfficiency
            const costEfficiencyB = b.performance.costEfficiency
            
            // Higher cost efficiency is better
            return costEfficiencyB - costEfficiencyA
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
     * Find cost-effective model alternatives
     */
    public static findAlternatives(
        selectedModel: ModelInfo,
        allModels: ModelInfo[],
        maxCostIncrease: number = 0.2 // 20% maximum cost increase
    ): ModelInfo[] {
        const selectedModelCost = this.estimateModelCost(selectedModel, {
            taskType: "code-generation",
            contextSize: selectedModel.contextWindow
        })

        const alternatives = allModels.filter(model => {
            // Don't include the selected model
            if (model.id === selectedModel.id) {
                return false
            }

            // Only include models with similar or better capabilities
            if (model.performance.accuracy < selectedModel.performance.accuracy * 0.9) {
                return false
            }

            // Check cost constraint
            const modelCost = this.estimateModelCost(model, {
                taskType: "code-generation",
                contextSize: model.contextWindow
            })

            return modelCost <= selectedModelCost * (1 + maxCostIncrease)
        })

        // Rank alternatives by cost efficiency
        return this.rankByCostEfficiency(alternatives)
    }

    /**
     * Balance cost and performance metrics
     */
    public static balanceCostAndPerformance(
        models: ModelInfo[],
        costWeight: number = 0.5,
        performanceWeight: number = 0.5
    ): ModelInfo[] {
        // Normalize metrics to 0-1 range
        const normalizedModels = this.normalizeMetrics(models)
        
        // Calculate weighted score for each model
        return normalizedModels.sort((a, b) => {
            const scoreA = this.calculateWeightedScore(a, costWeight, performanceWeight)
            const scoreB = this.calculateWeightedScore(b, costWeight, performanceWeight)
            
            // Lower score is better (better balance)
            return scoreA - scoreB
        })
    }

    /**
     * Normalize cost and performance metrics to 0-1 range
     */
    private static normalizeMetrics(models: ModelInfo[]): ModelInfo[] {
        if (models.length === 0) return []

        // Find min/max values for normalization
        const costs = models.map(m => this.estimateModelCost(m, {
            taskType: "code-generation",
            contextSize: 1000
        }))
        const minCost = Math.min(...costs)
        const maxCost = Math.max(...costs)

        const accuracies = models.map(m => m.performance.accuracy)
        const minAccuracy = Math.min(...accuracies)
        const maxAccuracy = Math.max(...accuracies)

        // Return models with normalized metrics
        return models.map(model => {
            const estimatedCost = this.estimateModelCost(model, {
                taskType: "code-generation",
                contextSize: 1000
            })
            const normalizedCost = maxCost > minCost ? 
                (estimatedCost - minCost) / (maxCost - minCost) : 0
            
            const normalizedAccuracy = maxAccuracy > minAccuracy ? 
                (model.performance.accuracy - minAccuracy) / (maxAccuracy - minAccuracy) : 0

            // Return a new object with normalized metrics in metadata
            return {
                ...model,
                metadata: {
                    ...model.metadata,
                    normalizedCost,
                    normalizedAccuracy
                }
            }
        })
    }

    /**
     * Calculate weighted score for a model
     */
    private static calculateWeightedScore(
        model: ModelInfo & { metadata?: { normalizedCost?: number, normalizedAccuracy?: number } },
        costWeight: number,
        performanceWeight: number
    ): number {
        const normalizedCost = model.metadata?.normalizedCost || 0
        const normalizedAccuracy = model.metadata?.normalizedAccuracy || 0

        // For cost, lower is better, so we use the normalized value directly
        // For accuracy, higher is better, so we use 1 - normalized value to make it consistent
        return (costWeight * normalizedCost) + (performanceWeight * (1 - normalizedAccuracy))
    }
}