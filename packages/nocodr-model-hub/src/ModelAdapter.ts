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

import { ModelInfo, ModelProvider } from "./types"

export interface ModelAdapterConfig {
    provider: string
    baseUrl?: string
    apiKey?: string
    defaultHeaders?: Record<string, string>
    timeout?: number
}

export class ModelAdapter {
    private config: ModelAdapterConfig
    private providerInfo: ModelProvider

    constructor(config: ModelAdapterConfig) {
        this.config = config
        this.providerInfo = this.initializeProviderInfo()
    }

    private initializeProviderInfo(): ModelProvider {
        return {
            id: this.config.provider,
            name: this.getProviderDisplayName(this.config.provider),
            baseUrl: this.config.baseUrl,
            apiKey: this.config.apiKey,
            models: [],
            metadata: {
                adapterType: "dynamic",
                initializedAt: new Date().toISOString()
            }
        }
    }

    private getProviderDisplayName(providerId: string): string {
        const displayNameMap: Record<string, string> = {
            "openai": "OpenAI",
            "anthropic": "Anthropic",
            "google": "Google AI",
            "mistral": "Mistral AI",
            "deepseek": "DeepSeek",
            "ollama": "Ollama",
            "huggingface": "Hugging Face",
            "lmstudio": "LM Studio",
            "openrouter": "OpenRouter",
            "together": "Together AI",
            "cohere": "Cohere",
            "replicate": "Replicate",
            "ai21": "AI21 Labs",
            "alephalpha": "Aleph Alpha",
            "amazon": "Amazon Bedrock",
            "azure": "Azure OpenAI",
            "cloudflare": "Cloudflare Workers AI",
            "databricks": "Databricks",
            "fireworks": "Fireworks AI",
            "groq": "Groq",
            "ibm": "IBM Watsonx",
            "meta": "Meta",
            "nvidia": "NVIDIA AI",
            "octoai": "OctoAI",
            "perplexity": "Perplexity AI",
            "pinecone": "Pinecone",
            "reka": "Reka AI",
            "sambanova": "SambaNova",
            "voyage": "Voyage AI",
            "xai": "xAI",
            "zhipu": "Zhipu AI"
        }
        
        return displayNameMap[providerId] || providerId
    }

    /**
     * Create adapter for OpenAI-compatible providers
     */
    public static createOpenAIAdapter(config: ModelAdapterConfig): ModelAdapter {
        return new ModelAdapter({
            ...config,
            provider: "openai"
        })
    }

    /**
     * Create adapter for Anthropic providers
     */
    public static createAnthropicAdapter(config: ModelAdapterConfig): ModelAdapter {
        return new ModelAdapter({
            ...config,
            provider: "anthropic",
            defaultHeaders: {
                "anthropic-version": "2023-06-01",
                ...config.defaultHeaders
            }
        })
    }

    /**
     * Create adapter for Google providers
     */
    public static createGoogleAdapter(config: ModelAdapterConfig): ModelAdapter {
        return new ModelAdapter({
            ...config,
            provider: "google"
        })
    }

    /**
     * Create adapter for Mistral providers
     */
    public static createMistralAdapter(config: ModelAdapterConfig): ModelAdapter {
        return new ModelAdapter({
            ...config,
            provider: "mistral"
        })
    }

    /**
     * Create adapter for DeepSeek providers
     */
    public static createDeepSeekAdapter(config: ModelAdapterConfig): ModelAdapter {
        return new ModelAdapter({
            ...config,
            provider: "deepseek"
        })
    }

    /**
     * Get provider information
     */
    public getProviderInfo(): ModelProvider {
        return { ...this.providerInfo }
    }

    /**
     * Update adapter configuration
     */
    public updateConfig(newConfig: Partial<ModelAdapterConfig>): void {
        this.config = { ...this.config, ...newConfig }
        this.providerInfo.baseUrl = this.config.baseUrl
        this.providerInfo.apiKey = this.config.apiKey
    }

    /**
     * Validate adapter configuration
     */
    public validateConfig(): { isValid: boolean; errors: string[] } {
        const errors: string[] = []
        
        if (!this.config.provider) {
            errors.push("Provider is required")
        }
        
        // Provider-specific validation
        switch (this.config.provider) {
            case "openai":
            case "anthropic":
            case "google":
            case "mistral":
            case "deepseek":
                if (!this.config.apiKey) {
                    errors.push(`API key is required for ${this.config.provider}`)
                }
                break
            case "ollama":
            case "lmstudio":
                if (!this.config.baseUrl) {
                    errors.push(`Base URL is required for ${this.config.provider}`)
                }
                break
        }
        
        return {
            isValid: errors.length === 0,
            errors
        }
    }

    /**
     * Normalize model info for this provider
     */
    public normalizeModelInfo(rawModel: any): ModelInfo {
        // This is a simplified normalization - in practice, this would be more complex
        // and provider-specific
        
        const normalized: ModelInfo = {
            id: rawModel.id || rawModel.name,
            name: rawModel.name || rawModel.id,
            provider: this.config.provider,
            displayName: rawModel.displayName || rawModel.name,
            description: rawModel.description,
            contextWindow: rawModel.contextWindow || rawModel.maxContextLength || 4096,
            maxTokens: rawModel.maxTokens || rawModel.maxOutputTokens || null,
            supportsImages: rawModel.supportsImages || rawModel.vision || false,
            supportsReasoningBudget: rawModel.supportsReasoningBudget || false,
            supportsTemperature: rawModel.supportsTemperature !== undefined ? rawModel.supportsTemperature : true,
            inputPrice: rawModel.inputPrice || rawModel.pricing?.input || 0,
            outputPrice: rawModel.outputPrice || rawModel.pricing?.output || 0,
            capabilities: {
                codeGeneration: rawModel.capabilities?.codeGeneration || true,
                reasoning: rawModel.capabilities?.reasoning || false,
                creativeWriting: rawModel.capabilities?.creativeWriting || true,
                dataAnalysis: rawModel.capabilities?.dataAnalysis || true,
                toolUsage: rawModel.capabilities?.toolUsage || false,
                multimodal: rawModel.capabilities?.multimodal || rawModel.supportsImages || false,
                longContext: (rawModel.contextWindow || rawModel.maxContextLength || 0) > 32768,
                realTime: rawModel.capabilities?.realTime || false
            },
            performance: {
                latency: rawModel.performance?.latency || 300,
                reliability: rawModel.performance?.reliability || 0.9,
                accuracy: rawModel.performance?.accuracy || 0.8,
                costEfficiency: rawModel.performance?.costEfficiency || 0.8,
                lastUpdated: new Date()
            }
        }
        
        return normalized
    }

    /**
     * Fetch models from provider API
     */
    public async fetchModels(): Promise<ModelInfo[]> {
        // This would make actual API calls to fetch models
        // For now, we'll return mock data based on the provider
        
        const mockModels: Record<string, any[]> = {
            "openai": [
                { id: "gpt-4-turbo", name: "GPT-4 Turbo", contextWindow: 128000, maxTokens: 4096, supportsImages: true },
                { id: "gpt-4o", name: "GPT-4o", contextWindow: 128000, maxTokens: 4096, supportsImages: true },
                { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", contextWindow: 16385, maxTokens: 4096, supportsImages: false }
            ],
            "anthropic": [
                { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", contextWindow: 200000, maxTokens: 8192, supportsImages: true },
                { id: "claude-3-opus", name: "Claude 3 Opus", contextWindow: 200000, maxTokens: 4096, supportsImages: true }
            ],
            "google": [
                { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", contextWindow: 1000000, maxTokens: 8192, supportsImages: true },
                { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", contextWindow: 1000000, maxTokens: 8192, supportsImages: true }
            ]
        }
        
        const rawModels = mockModels[this.config.provider] || []
        return rawModels.map(model => this.normalizeModelInfo(model))
    }

    /**
     * Test connection to provider
     */
    public async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            // This would make an actual API call to test the connection
            // For now, we'll simulate a successful connection
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 100))
            
            return { success: true }
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : String(error) 
            }
        }
    }
}