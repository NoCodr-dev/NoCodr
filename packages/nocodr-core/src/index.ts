// Copyright 2025 NoCoder Inc.
// SPDX-License-Identifier: Apache-2.0

/**
 * NoCodr Core - Meta-Agent Orchestration Engine
 * 
 * This module provides the core orchestration capabilities for NoCodr's
 * multi-agent system, including:
 * - Agent lifecycle management
 * - Inter-agent communication
 * - Task coordination and delegation
 * - Shared memory system
 * - Role handoff mechanisms
 * - Trace and replay functionality
 */

export * from './types';
export * from './agents';
export * from './memory';
export * from './trace';
export * from './orchestrator';