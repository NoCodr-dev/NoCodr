// Copyright 2025 NoCoder Inc.
// SPDX-License-Identifier: Apache-2.0

import { MemoryItem } from './types';

export interface MemoryQueryOptions {
	limit?: number;
	sortBy?: 'timestamp' | 'id';
	sortOrder?: 'asc' | 'desc';
	filterByAgent?: string;
	filterByType?: string;
	searchText?: string;
}

export interface MemoryStats {
	totalItems: number;
	byType: Record<string, number>;
	byAgent: Record<string, number>;
	oldestItem: Date | null;
	newestItem: Date | null;
	averageSize: number;
}

export class SharedMemory {
	private items: Map<string, MemoryItem> = new Map();
	private maxSize: number = 1000;
	private observers: Array<(item: MemoryItem) => void> = [];

	constructor(maxSize: number = 1000) {
		this.maxSize = maxSize;
	}

	set(key: string, content: any, metadata: Record<string, any> = {}): void {
		if (this.items.size >= this.maxSize) {
			// Remove oldest item if at capacity
			const firstKey = this.getOldestKey();
			if (firstKey) {
				this.items.delete(firstKey);
			}
		}

		const item: MemoryItem = {
			id: key,
			content: JSON.stringify(content),
			timestamp: new Date(),
			metadata
		};

		this.items.set(key, item);
		
		// Notify observers
		this.notifyObservers(item);
	}

	get(key: string): any {
		const item = this.items.get(key);
		if (!item) {
			return undefined;
		}

		try {
			return JSON.parse(item.content);
		} catch {
			return item.content;
		}
	}

	has(key: string): boolean {
		return this.items.has(key);
	}

	delete(key: string): boolean {
		return this.items.delete(key);
	}

	clear(): void {
		this.items.clear();
	}

	size(): number {
		return this.items.size;
	}

	getAllKeys(): string[] {
		return Array.from(this.items.keys());
	}

	getRecentItems(limit: number = 10): MemoryItem[] {
		const items = Array.from(this.items.values());
		return items.slice(-limit).reverse();
	}

	search(query: string): MemoryItem[] {
		const results: MemoryItem[] = [];
		for (const item of this.items.values()) {
			if (item.content.includes(query) || 
				(item.metadata && JSON.stringify(item.metadata).includes(query))) {
				results.push(item);
			}
		}
		return results;
	}

	// Enhanced memory operations for agent communication
	
	/**
	 * Subscribe to memory changes
	 */
	subscribe(observer: (item: MemoryItem) => void): () => void {
		this.observers.push(observer);
		return () => {
			const index = this.observers.indexOf(observer);
			if (index > -1) {
				this.observers.splice(index, 1);
			}
		};
	}

	/**
	 * Get items with advanced querying
	 */
	query(options: MemoryQueryOptions = {}): MemoryItem[] {
		let items = Array.from(this.items.values());

		// Apply filters
		if (options.filterByAgent) {
			items = items.filter(item => 
				item.metadata?.agentId === options.filterByAgent
			);
		}

		if (options.filterByType) {
			items = items.filter(item => 
				item.metadata?.type === options.filterByType
			);
		}

		if (options.searchText) {
			const searchText = options.searchText;
			items = items.filter(item => 
				item.content.includes(searchText) ||
				(item.metadata && JSON.stringify(item.metadata).includes(searchText))
			);
		}

		// Apply sorting
		if (options.sortBy === 'timestamp') {
			items.sort((a, b) => 
				options.sortOrder === 'desc' 
					? b.timestamp.getTime() - a.timestamp.getTime()
					: a.timestamp.getTime() - b.timestamp.getTime()
			);
		} else if (options.sortBy === 'id') {
			items.sort((a, b) => 
				options.sortOrder === 'desc'
					? b.id.localeCompare(a.id)
					: a.id.localeCompare(b.id)
			);
		}

		// Apply limit
		if (options.limit && options.limit > 0) {
			items = items.slice(0, options.limit);
		}

		return items;
	}

	/**
	 * Append content to existing memory item or create new one
	 */
	append(key: string, content: any, separator: string = '\n'): void {
		const existing = this.get(key);
		if (existing !== undefined) {
			const newContent = Array.isArray(existing) 
				? [...existing, content]
				: `${existing}${separator}${content}`;
			this.set(key, newContent);
		} else {
			this.set(key, content);
		}
	}

	/**
	 * Merge metadata with existing item
	 */
	updateMetadata(key: string, metadata: Record<string, any>): void {
		const item = this.items.get(key);
		if (item) {
			item.metadata = { ...item.metadata, ...metadata };
			item.timestamp = new Date();
			this.items.set(key, item);
			this.notifyObservers(item);
		}
	}

	/**
	 * Get memory statistics
	 */
	getStats(): MemoryStats {
		const items = Array.from(this.items.values());
		if (items.length === 0) {
			return {
				totalItems: 0,
				byType: {},
				byAgent: {},
				oldestItem: null,
				newestItem: null,
				averageSize: 0
			};
		}

		const byType: Record<string, number> = {};
		const byAgent: Record<string, number> = {};
		let totalSize = 0;

		items.forEach(item => {
			// Count by type
			const type = item.metadata?.type || 'unknown';
			byType[type] = (byType[type] || 0) + 1;

			// Count by agent
			const agent = item.metadata?.agentId || 'unknown';
			byAgent[agent] = (byAgent[agent] || 0) + 1;

			// Calculate size
			totalSize += item.content.length;
		});

		const timestamps = items.map(item => item.timestamp.getTime());
		const oldestItem = new Date(Math.min(...timestamps));
		const newestItem = new Date(Math.max(...timestamps));

		return {
			totalItems: items.length,
			byType,
			byAgent,
			oldestItem,
			newestItem,
			averageSize: Math.round(totalSize / items.length)
		};
	}

	/**
	 * Export memory to JSON
	 */
	export(): string {
		return JSON.stringify({
			items: Array.from(this.items.values()),
			exportedAt: new Date().toISOString()
		}, null, 2);
	}

	/**
	 * Import memory from JSON
	 */
	import(json: string): void {
		const data = JSON.parse(json);
		const items = data.items as MemoryItem[];
		
		items.forEach(item => {
			this.items.set(item.id, {
				...item,
				timestamp: new Date(item.timestamp)
			});
		});
	}

	/**
	 * Create a snapshot of current memory state
	 */
	createSnapshot(): string {
		return this.export();
	}

	/**
	 * Restore from a snapshot
	 */
	restoreSnapshot(snapshot: string): void {
		this.clear();
		this.import(snapshot);
	}

	/**
	 * Get items by time range
	 */
	getByTimeRange(startTime: Date, endTime: Date): MemoryItem[] {
		return Array.from(this.items.values()).filter(item => 
			item.timestamp >= startTime && item.timestamp <= endTime
		);
	}

	/**
	 * Get items older than specified time
	 */
	getOlderThan(hours: number): MemoryItem[] {
		const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
		return this.getByTimeRange(new Date(0), cutoff);
	}

	/**
	 * Clean up old items
	 */
	cleanupOlderThan(hours: number): number {
		const oldItems = this.getOlderThan(hours);
		oldItems.forEach(item => this.delete(item.id));
		return oldItems.length;
	}

	// Private helper methods

	private getOldestKey(): string | undefined {
		if (this.items.size === 0) return undefined;
		
		let oldestKey: string | undefined;
		let oldestTime = Infinity;
		
		for (const [key, item] of this.items) {
			const time = item.timestamp.getTime();
			if (time < oldestTime) {
				oldestTime = time;
				oldestKey = key;
			}
		}
		
		return oldestKey;
	}

	private notifyObservers(item: MemoryItem): void {
		this.observers.forEach(observer => {
			try {
				observer(item);
			} catch (error) {
				console.warn('Memory observer error:', error);
			}
		});
	}
}