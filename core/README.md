# NoCodr Core Adapters

This directory contains the **Core Adapter Layer** that wraps Kilo Code functionality.

## Purpose

NoCodr inherits all capabilities from Kilo Code (which inherited from Roo Code → Cline). The `core/` directory provides:

- **Adapters**: Thin wrappers around Kilo Code services from `src/`
- **Compatibility Shims**: Command/ID aliases for backward compatibility
- **Extension Points**: Hooks to augment Kilo Code behavior without modification

## Directory Structure

```
core/
├── kilocode-adapters/    # Wrappers around src/ services
├── compat-aliases/       # Command & ID mappers (nocodr.* ⇄ kilo-code.* ⇄ roo-code.*)
└── README.md            # This file
```

## Integration Patterns

### 1. Wrapper Pattern (Preferred)
Inherit Kilo behavior and add pre/post hooks:
```typescript
import { KiloService } from "../../src/services/KiloService"

export class NoCodrService extends KiloService {
  async execute(params) {
    // Pre-hook: NoCodr augmentation
    await this.preExecute(params)
    
    // Execute Kilo Code's original functionality
    const result = await super.execute(params)
    
    // Post-hook: NoCodr augmentation
    await this.postExecute(result)
    
    return result
  }
}
```

### 2. Adapter Pattern
Replace internals while preserving public API:
```typescript
export interface IKiloExec { run(cmd: string): Promise<ExecResult> }

export class NoCodrExecAdapter implements IKiloExec {
  constructor(private sandbox: Sandbox) {}
  
  async run(cmd: string) {
    // NoCodr implementation with sandbox
    return this.sandbox.run(cmd)
  }
}
```

### 3. Side-car Pattern
Independent features that run alongside Kilo:
```typescript
// Example: Live collaboration, Agent Graph Studio
// These don't modify Kilo Code APIs
```

## Rules

1. **Never overwrite `src/`** - Always wrap or extend
2. **Preserve Kilo APIs** - Maintain compatibility
3. **Use feature flags** - Allow enabling/disabling NoCodr features
4. **Keep aliases working** - Support legacy command IDs

## Environment Variables

- `NOCODR_IPC_SOCKET_PATH` - Primary IPC socket (falls back to `KILO_IPC_SOCKET_PATH`, then `ROO_CODE_IPC_SOCKET_PATH`)
- `NOCODR_TELEMETRY_OPT_OUT=1` - Disable telemetry
