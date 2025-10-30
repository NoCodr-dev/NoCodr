# NoCodr Model Hub++

Enhanced AI Model Management and Routing for NoCodr.

## Overview

The NoCodr Model Hub++ is an advanced system for managing, selecting, and routing AI models from 600+ providers. It provides intelligent model selection based on cost, latency, accuracy, and other performance metrics, along with fallback routing for high availability.

## Features

### 1. Extensive Model Registry
- Supports 600+ AI models from major providers (OpenAI, Anthropic, Google, Mistral, DeepSeek, etc.)
- Comprehensive model metadata including capabilities, performance metrics, and pricing
- Flexible model aliasing system

### 2. Dynamic Model Adapters
- Provider-specific adapters for OpenAI, Anthropic, Google, Mistral, DeepSeek, and more
- Automatic configuration validation
- Model fetching and connection testing capabilities

### 3. Intelligent Model Selection
- Capability-based model filtering
- Context window and performance requirement matching
- Provider preference and exclusion support

### 4. Cost Optimization
- Budget-aware model selection
- Cost estimation and comparison
- Alternative model recommendations

### 5. Latency Optimization
- Latency-constrained model selection
- Performance ranking algorithms
- Multi-objective optimization

### 6. Fallback Routing
- Health-based provider monitoring
- Intelligent fallback selection
- Customizable routing policies

## Installation

```bash
npm install @nocodr/model-hub
```

## Usage

### Basic Model Selection

```typescript
import { ModelHub } from '@nocodr/model-hub';

const modelHub = new ModelHub({ populateWithPopularModels: true });

const criteria = {
  taskType: "code-generation",
  requiredCapabilities: ["codeGeneration", "toolUsage"],
  contextSize: 8000
};

const model = modelHub.selectModel(criteria);
console.log(`Selected model: ${model?.displayName}`);
```

### Cost Optimization

```typescript
const costOptimizedModel = modelHub.optimizeForCost(criteria, 0.01); // $0.01 budget
console.log(`Cost-optimized model: ${costOptimizedModel?.displayName}`);
```

### Latency Optimization

```typescript
const latencyOptimizedModel = modelHub.optimizeForLatency(criteria, 300); // 300ms max
console.log(`Latency-optimized model: ${latencyOptimizedModel?.displayName}`);
```

### Model Adapter Creation

```typescript
const adapter = modelHub.createAdapter({
  provider: "openai",
  apiKey: "your-api-key"
});

const validation = adapter.validateConfig();
if (validation.isValid) {
  console.log("Adapter configuration is valid");
}
```

### Fallback Routing

```typescript
const fallbackRouter = modelHub.getFallbackRouter();
const stats = fallbackRouter.getStatistics();
console.log(`Healthy providers: ${stats.healthyProviders}`);
```

## API Reference

### ModelHub
Main entry point for model management and selection.

### ModelRegistry
Core registry for storing and retrieving model information.

### ModelAdapter
Provider-specific adapters for different AI services.

### CostOptimizer
Utilities for cost-based model optimization.

### LatencyOptimizer
Utilities for latency-based model optimization.

### FallbackRouter
System for handling model and provider failures.

## Supported Providers

- OpenAI
- Anthropic
- Google AI
- Mistral AI
- DeepSeek
- Ollama
- Hugging Face
- LM Studio
- OpenRouter
- Together AI
- Cohere
- Replicate
- And 500+ more providers

## License

Apache 2.0