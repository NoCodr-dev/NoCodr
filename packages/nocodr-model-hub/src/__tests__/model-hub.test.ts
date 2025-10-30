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

import { describe, it, expect, beforeEach } from 'vitest';
import { ModelHub } from "../ModelHub"
import { ModelRegistry } from "../ModelRegistry"
import { ModelAdapter } from "../ModelAdapter"
import { CostOptimizer } from "../CostOptimizer"
import { LatencyOptimizer } from "../LatencyOptimizer"

describe("ModelHub", () => {
    let modelHub: ModelHub

    beforeEach(() => {
        modelHub = new ModelHub({ populateWithPopularModels: true })
    })

    it("should initialize with popular models", () => {
        const stats = modelHub.getStatistics()
        expect(stats.modelCount).toBeGreaterThan(0)
        expect(stats.providerCount).toBeGreaterThan(0)
    })

    it("should select models by criteria", () => {
        const criteria = {
            taskType: "code-generation" as const,
            requiredCapabilities: ["codeGeneration" as const]
        }
        
        const model = modelHub.selectModel(criteria)
        expect(model).toBeDefined()
        expect(model?.capabilities.codeGeneration).toBe(true)
    })

    it("should create adapters for different providers", () => {
        const openaiAdapter = modelHub.createAdapter({
            provider: "openai",
            apiKey: "test-key"
        })
        
        const anthropicAdapter = modelHub.createAdapter({
            provider: "anthropic",
            apiKey: "test-key"
        })
        
        expect(openaiAdapter).toBeDefined()
        expect(anthropicAdapter).toBeDefined()
        
        const retrievedOpenAI = modelHub.getAdapter("openai")
        expect(retrievedOpenAI).toBeDefined()
    })

    it("should optimize for cost", () => {
        const criteria = {
            taskType: "code-generation" as const,
            contextSize: 1000
        }
        
        const costOptimizedModel = modelHub.optimizeForCost(criteria, 0.01)
        expect(costOptimizedModel).toBeDefined()
    })

    it("should optimize for latency", () => {
        const criteria = {
            taskType: "code-generation" as const,
            contextSize: 1000
        }
        
        const latencyOptimizedModel = modelHub.optimizeForLatency(criteria, 500)
        expect(latencyOptimizedModel).toBeDefined()
    })
})

describe("ModelRegistry", () => {
    let registry: ModelRegistry

    beforeEach(() => {
        registry = new ModelRegistry()
        registry.populateWithPopularModels()
    })

    it("should register and retrieve models", () => {
        const modelCount = registry.getModelCount()
        expect(modelCount).toBeGreaterThan(0)
    })

    it("should select models by provider", () => {
        const openaiModels = registry.getModelsByProvider("openai")
        expect(openaiModels.length).toBeGreaterThan(0)
    })
})

describe("ModelAdapter", () => {
    it("should create adapters for different providers", () => {
        const openaiAdapter = ModelAdapter.createOpenAIAdapter({
            provider: "openai",
            apiKey: "test-key"
        })
        
        const anthropicAdapter = ModelAdapter.createAnthropicAdapter({
            provider: "anthropic",
            apiKey: "test-key"
        })
        
        expect(openaiAdapter).toBeDefined()
        expect(anthropicAdapter).toBeDefined()
        
        // Test validation
        const validationResult = openaiAdapter.validateConfig()
        expect(validationResult.isValid).toBe(true)
    })
})

describe("CostOptimizer", () => {
    it("should optimize models for cost", () => {
        const mockModels: any[] = [
            {
                id: "model-1",
                provider: "openai",
                inputPrice: 0.01,
                outputPrice: 0.03,
                performance: {
                    costEfficiency: 0.8,
                    accuracy: 0.9,
                    latency: 200,
                    reliability: 0.95,
                    lastUpdated: new Date()
                }
            },
            {
                id: "model-2",
                provider: "anthropic",
                inputPrice: 0.005,
                outputPrice: 0.015,
                performance: {
                    costEfficiency: 0.9,
                    accuracy: 0.85,
                    latency: 300,
                    reliability: 0.9,
                    lastUpdated: new Date()
                }
            }
        ]
        
        const criteria = {
            taskType: "code-generation" as const,
            contextSize: 1000
        }
        
        const result = CostOptimizer.optimizeForCost(mockModels, criteria, 0.05)
        expect(result).toBeDefined()
        expect(result?.model).toBeDefined()
    })
})

describe("LatencyOptimizer", () => {
    it("should optimize models for latency", () => {
        const mockModels: any[] = [
            {
                id: "fast-model",
                provider: "provider-1",
                performance: {
                    latency: 100,
                    accuracy: 0.8,
                    reliability: 0.9,
                    costEfficiency: 0.7,
                    lastUpdated: new Date()
                }
            },
            {
                id: "slow-model",
                provider: "provider-2",
                performance: {
                    latency: 300,
                    accuracy: 0.9,
                    reliability: 0.95,
                    costEfficiency: 0.8,
                    lastUpdated: new Date()
                }
            }
        ]
        
        const criteria = {
            taskType: "code-generation" as const
        }
        
        const result = LatencyOptimizer.optimizeForLatency(mockModels, criteria, 250)
        expect(result).toBeDefined()
        expect(result?.model).toBeDefined()
        expect(result?.model.performance.latency).toBeLessThanOrEqual(250)
    })
})