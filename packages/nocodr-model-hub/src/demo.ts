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

import { ModelHub } from "./ModelHub"
import { ModelAdapter } from "./ModelAdapter"

// Demo function to showcase Model Hub++ capabilities
async function demoModelHub() {
    console.log("=== NoCodr Model Hub++ Demo ===\n")

    // Initialize ModelHub
    const modelHub = new ModelHub({ populateWithPopularModels: true })
    
    console.log(`Initialized with ${modelHub.getStatistics().modelCount} models from ${modelHub.getStatistics().providerCount} providers\n`)

    // 1. Model Selection by Capabilities
    console.log("1. Model Selection by Capabilities")
    const codeGenCriteria = {
        taskType: "code-generation" as const,
        requiredCapabilities: ["codeGeneration" as const, "toolUsage" as const],
        contextSize: 8000
    }
    
    const codeGenModel = modelHub.selectModel(codeGenCriteria)
    console.log(`Selected model for code generation: ${codeGenModel?.displayName} (${codeGenModel?.id})\n`)

    // 2. Cost Optimization
    console.log("2. Cost Optimization")
    const costOptimizedModel = modelHub.optimizeForCost(codeGenCriteria, 0.01) // $0.01 budget
    console.log(`Cost-optimized model: ${costOptimizedModel?.displayName} (${costOptimizedModel?.id})\n`)

    // 3. Latency Optimization
    console.log("3. Latency Optimization")
    const latencyOptimizedModel = modelHub.optimizeForLatency(codeGenCriteria, 300) // 300ms max latency
    console.log(`Latency-optimized model: ${latencyOptimizedModel?.displayName} (${latencyOptimizedModel?.id})\n`)

    // 4. Balanced Optimization
    console.log("4. Balanced Cost/Latency Optimization")
    const balancedModels = modelHub.balanceCostAndLatency(codeGenCriteria, 0.6, 0.4) // 60% cost, 40% latency
    console.log(`Top 3 balanced models:`)
    balancedModels.slice(0, 3).forEach((model, index) => {
        console.log(`  ${index + 1}. ${model.displayName} (${model.id})`)
    })
    console.log()

    // 5. Model Adapter Creation
    console.log("5. Model Adapter Creation")
    const openaiAdapter = modelHub.createAdapter({
        provider: "openai",
        apiKey: "sk-...test-key...",
        baseUrl: "https://api.openai.com/v1"
    })
    
    const anthropicAdapter = modelHub.createAdapter({
        provider: "anthropic",
        apiKey: "sk-...test-key...",
        baseUrl: "https://api.anthropic.com"
    })
    
    console.log(`Created OpenAI adapter: ${openaiAdapter.getProviderInfo().name}`)
    console.log(`Created Anthropic adapter: ${anthropicAdapter.getProviderInfo().name}\n`)

    // 6. Adapter Configuration Validation
    console.log("6. Adapter Configuration Validation")
    const openaiValidation = openaiAdapter.validateConfig()
    const anthropicValidation = anthropicAdapter.validateConfig()
    
    console.log(`OpenAI config valid: ${openaiValidation.isValid}`)
    console.log(`Anthropic config valid: ${anthropicValidation.isValid}\n`)

    // 7. Cost Optimization Information
    console.log("7. Cost Optimization Information")
    if (codeGenModel) {
        const costInfo = modelHub.getCostOptimizationInfo(codeGenModel, codeGenCriteria)
        console.log(`Estimated cost for ${codeGenModel.displayName}: $${costInfo.estimatedCost.toFixed(4)}`)
        console.log(`Available alternatives: ${costInfo.alternatives.length}\n`)
    }

    // 8. Fallback Routing
    console.log("8. Fallback Routing")
    const fallbackRouter = modelHub.getFallbackRouter()
    const fallbackStats = fallbackRouter.getStatistics()
    console.log(`Fallback router statistics:`)
    console.log(`  Total routes: ${fallbackStats.totalRoutes}`)
    console.log(`  Healthy providers: ${fallbackStats.healthyProviders}`)
    console.log(`  Degraded providers: ${fallbackStats.degradedProviders}`)
    console.log(`  Unavailable providers: ${fallbackStats.unavailableProviders}\n`)

    // 9. Model Fetching (simulated)
    console.log("9. Model Fetching (simulated)")
    try {
        const openaiModels = await openaiAdapter.fetchModels()
        console.log(`Fetched ${openaiModels.length} models from OpenAI`)
        
        const anthropicModels = await anthropicAdapter.fetchModels()
        console.log(`Fetched ${anthropicModels.length} models from Anthropic\n`)
    } catch (error) {
        console.log(`Error fetching models: ${(error as Error).message}\n`)
    }

    // 10. Connection Testing
    console.log("10. Connection Testing")
    try {
        const openaiTest = await openaiAdapter.testConnection()
        console.log(`OpenAI connection test: ${openaiTest.success ? 'SUCCESS' : 'FAILED'}`)
        
        const anthropicTest = await anthropicAdapter.testConnection()
        console.log(`Anthropic connection test: ${anthropicTest.success ? 'SUCCESS' : 'FAILED'}\n`)
    } catch (error) {
        console.log(`Error testing connections: ${(error as Error).message}\n`)
    }

    console.log("=== Demo Complete ===")
}

// Run the demo
demoModelHub().catch(console.error)