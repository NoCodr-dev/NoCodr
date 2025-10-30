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

export interface ModelInfo {
    id: string
    name: string
    provider: string
    displayName?: string
    description?: string
    contextWindow: number
    maxTokens: number | null
    maxThinkingTokens?: number | null
    supportsImages?: boolean
    supportsComputerUse?: boolean
    supportsPromptCache?: boolean
    supportsVerbosity?: boolean
    supportsReasoningBudget?: boolean
    supportsTemperature?: boolean
    requiredReasoningBudget?: boolean
    supportsReasoningEffort?: boolean
    supportedParameters?: string[]
    inputPrice?: number
    outputPrice?: number
    cacheWritesPrice?: number
    cacheReadsPrice?: number
    reasoningEffort?: "low" | "medium" | "high"
    minTokensPerCachePoint?: number
    maxCachePoints?: number
    cachableFields?: string[]
    tiers?: ModelTier[]
    capabilities: ModelCapabilities
    performance: ModelPerformance
    metadata?: Record<string, any>
}

export interface ModelTier {
    name?: "default" | "flex" | "priority"
    contextWindow: number
    inputPrice?: number
    outputPrice?: number
    cacheWritesPrice?: number
    cacheReadsPrice?: number
}

export interface ModelCapabilities {
    codeGeneration: boolean
    reasoning: boolean
    creativeWriting: boolean
    dataAnalysis: boolean
    toolUsage: boolean
    multimodal: boolean
    longContext: boolean
    realTime: boolean
}

export interface ModelPerformance {
    latency: number // milliseconds
    reliability: number // 0-1 scale
    accuracy: number // 0-1 scale
    costEfficiency: number // 0-1 scale
    lastUpdated: Date
}

export interface ModelProvider {
    id: string
    name: string
    baseUrl?: string
    apiKey?: string
    models: ModelInfo[]
    rateLimits?: ProviderRateLimits
    metadata?: Record<string, any>
}

export interface ProviderRateLimits {
    requestsPerMinute?: number
    tokensPerMinute?: number
    tokensPerDay?: number
}

export interface ModelSelectionCriteria {
    taskType: "code-generation" | "reasoning" | "creative-writing" | "data-analysis" | "tool-usage"
    contextSize?: number
    budget?: number
    maxLatency?: number
    requiredCapabilities?: (keyof ModelCapabilities)[]
    preferredProviders?: string[]
    excludeProviders?: string[]
}

export interface ModelSelectionResult {
    model: ModelInfo
    provider: ModelProvider
    estimatedCost: number
    estimatedLatency: number
    confidence: number
}

export interface RoutingDecision {
    modelId: string
    providerId: string
    reason: string
    timestamp: Date
    metadata?: Record<string, any>
}