// Copyright 2025 NoCoder Inc.
// SPDX-License-Identifier: Apache-2.0

import { TraceEvent } from './types';

export interface TraceQueryOptions {
	limit?: number;
	sortBy?: 'timestamp' | 'agentId' | 'action';
	sortOrder?: 'asc' | 'desc';
	filterByAgent?: string;
	filterByAction?: string;
	filterByTimeRange?: { start: Date; end: Date };
	searchText?: string;
}

export interface TraceStats {
	totalEvents: number;
	eventsByAgent: Record<string, number>;
	eventsByAction: Record<string, number>;
	durationStats: { min: number; max: number; avg: number };
	firstEvent: Date | null;
	lastEvent: Date | null;
}

export interface ReplayOptions {
	speed?: number; // 1.0 = normal, 2.0 = 2x speed, 0.5 = half speed
	startTime?: Date;
	endTime?: Date;
	filterByAgent?: string[];
	filterByAction?: string[];
}

export interface ReplayEvent {
	event: TraceEvent;
	delay: number; // milliseconds to wait before this event
	timestamp: Date;
}

export class TraceEngine {
	private events: TraceEvent[] = [];
	private maxSize: number = 10000;
	private observers: Array<(event: TraceEvent) => void> = [];
	private replayObservers: Array<(event: TraceEvent) => void> = [];

	constructor(maxSize: number = 10000) {
		this.maxSize = maxSize;
	}

	recordEvent(agentId: string, action: string, input?: any, output?: any, duration?: number): string {
		if (this.events.length >= this.maxSize) {
			// Remove oldest events if at capacity
			this.events = this.events.slice(this.events.length - this.maxSize + 1);
		}

		const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const event: TraceEvent = {
			id: eventId,
			timestamp: new Date(),
			agentId,
			action,
			input,
			output,
			duration
		};

		this.events.push(event);
		
		// Notify observers
		this.notifyObservers(event);
		
		return eventId;
	}

	getEvent(eventId: string): TraceEvent | undefined {
		return this.events.find(event => event.id === eventId);
	}

	getEventsByAgent(agentId: string): TraceEvent[] {
		return this.events.filter(event => event.agentId === agentId);
	}

	getEventsByAction(action: string): TraceEvent[] {
		return this.events.filter(event => event.action === action);
	}

	getEventsByTimeRange(startTime: Date, endTime: Date): TraceEvent[] {
		return this.events.filter(event => 
			event.timestamp >= startTime && event.timestamp <= endTime
		);
	}

	getAllEvents(): TraceEvent[] {
		return [...this.events];
	}

	exportToJSON(): string {
		return JSON.stringify({
			events: this.events,
			exportedAt: new Date().toISOString(),
			version: '1.0'
		}, null, 2);
	}

	importFromJSON(json: string): void {
		const data = JSON.parse(json);
		const events = data.events as TraceEvent[];
		
		this.events = events.map((event: any) => ({
			...event,
			timestamp: new Date(event.timestamp)
		}));
	}

	clear(): void {
		this.events = [];
	}

	getEventCount(): number {
		return this.events.length;
	}

	getDurationStats(): { min: number; max: number; avg: number } {
		const durations = this.events
			.filter(event => event.duration !== undefined)
			.map(event => event.duration!) as number[];

		if (durations.length === 0) {
			return { min: 0, max: 0, avg: 0 };
		}

		const min = Math.min(...durations);
		const max = Math.max(...durations);
		const avg = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;

		return { min, max, avg };
	}

	// Enhanced query capabilities

	query(options: TraceQueryOptions = {}): TraceEvent[] {
		let events = [...this.events];

		// Apply time range filter
		if (options.filterByTimeRange) {
			events = events.filter(event => 
				event.timestamp >= options.filterByTimeRange!.start && 
				event.timestamp <= options.filterByTimeRange!.end
			);
		}

		// Apply agent filter
		if (options.filterByAgent) {
			events = events.filter(event => event.agentId === options.filterByAgent);
		}

		// Apply action filter
		if (options.filterByAction) {
			events = events.filter(event => event.action === options.filterByAction);
		}

		// Apply text search
		if (options.searchText) {
			const searchText = options.searchText.toLowerCase();
			events = events.filter(event => 
				event.agentId.toLowerCase().includes(searchText) ||
				event.action.toLowerCase().includes(searchText) ||
				(event.input && JSON.stringify(event.input).toLowerCase().includes(searchText)) ||
				(event.output && JSON.stringify(event.output).toLowerCase().includes(searchText))
			);
		}

		// Apply sorting
		if (options.sortBy === 'timestamp') {
			events.sort((a, b) => 
				options.sortOrder === 'desc' 
					? b.timestamp.getTime() - a.timestamp.getTime()
					: a.timestamp.getTime() - b.timestamp.getTime()
			);
		} else if (options.sortBy === 'agentId') {
			events.sort((a, b) => 
				options.sortOrder === 'desc'
					? b.agentId.localeCompare(a.agentId)
					: a.agentId.localeCompare(b.agentId)
			);
		} else if (options.sortBy === 'action') {
			events.sort((a, b) => 
				options.sortOrder === 'desc'
					? b.action.localeCompare(a.action)
					: a.action.localeCompare(b.action)
			);
		}

		// Apply limit
		if (options.limit && options.limit > 0) {
			events = events.slice(0, options.limit);
		}

		return events;
	}

	// Statistics and analysis

	getStats(): TraceStats {
		if (this.events.length === 0) {
			return {
				totalEvents: 0,
				eventsByAgent: {},
				eventsByAction: {},
				durationStats: { min: 0, max: 0, avg: 0 },
				firstEvent: null,
				lastEvent: null
			};
		}

		const eventsByAgent: Record<string, number> = {};
		const eventsByAction: Record<string, number> = {};

		this.events.forEach(event => {
			eventsByAgent[event.agentId] = (eventsByAgent[event.agentId] || 0) + 1;
			eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;
		});

		const timestamps = this.events.map(event => event.timestamp.getTime());
		const firstEvent = new Date(Math.min(...timestamps));
		const lastEvent = new Date(Math.max(...timestamps));

		return {
			totalEvents: this.events.length,
			eventsByAgent,
			eventsByAction,
			durationStats: this.getDurationStats(),
			firstEvent,
			lastEvent
		};
	}

	// Replay engine

	async replay(options: ReplayOptions = {}): Promise<void> {
		const replayEvents = this.prepareReplayEvents(options);
		
		for (const replayEvent of replayEvents) {
			// Wait for the specified delay
			if (replayEvent.delay > 0) {
				await new Promise(resolve => setTimeout(resolve, replayEvent.delay));
			}
			
			// Notify replay observers
			this.notifyReplayObservers(replayEvent.event);
		}
	}

	prepareReplayEvents(options: ReplayOptions): ReplayEvent[] {
		let events = [...this.events];

		// Apply filters
		if (options.filterByAgent && options.filterByAgent.length > 0) {
			events = events.filter(event => options.filterByAgent!.includes(event.agentId));
		}

		if (options.filterByAction && options.filterByAction.length > 0) {
			events = events.filter(event => options.filterByAction!.includes(event.action));
		}

		// Apply time range
		if (options.startTime || options.endTime) {
			events = events.filter(event => {
				const eventTime = event.timestamp.getTime();
				const startTime = options.startTime?.getTime() || 0;
				const endTime = options.endTime?.getTime() || Infinity;
				return eventTime >= startTime && eventTime <= endTime;
			});
		}

		// Sort by timestamp
		events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

		if (events.length === 0) {
			return [];
		}

		// Calculate delays between events
		const replayEvents: ReplayEvent[] = [];
		const speed = options.speed || 1.0;
		const firstEventTime = events[0].timestamp.getTime();

		for (let i = 0; i < events.length; i++) {
			const event = events[i];
			let delay = 0;

			if (i > 0) {
				const prevEventTime = events[i - 1].timestamp.getTime();
				const actualDelay = event.timestamp.getTime() - prevEventTime;
				delay = Math.max(0, actualDelay / speed);
			} else if (options.startTime) {
				// Delay from start time to first event
				const startTime = options.startTime.getTime();
				const actualDelay = event.timestamp.getTime() - startTime;
				delay = Math.max(0, actualDelay / speed);
			}

			replayEvents.push({
				event,
				delay,
				timestamp: event.timestamp
			});
		}

		return replayEvents;
	}

	// Replay subscription

	subscribeToReplay(observer: (event: TraceEvent) => void): () => void {
		this.replayObservers.push(observer);
		return () => {
			const index = this.replayObservers.indexOf(observer);
			if (index > -1) {
				this.replayObservers.splice(index, 1);
			}
		};
	}

	// Export in different formats

	exportToCSV(): string {
		const headers = ['ID', 'Timestamp', 'Agent', 'Action', 'Duration', 'Input', 'Output'];
		const rows = this.events.map(event => [
			event.id,
			event.timestamp.toISOString(),
			event.agentId,
			event.action,
			event.duration?.toString() || '',
			event.input ? JSON.stringify(event.input) : '',
			event.output ? JSON.stringify(event.output) : ''
		]);

		return [
			headers.join(','),
			...rows.map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
		].join('\n');
	}

	exportToTimeline(): any[] {
		return this.events.map(event => ({
			id: event.id,
			start: event.timestamp,
			end: event.duration ? new Date(event.timestamp.getTime() + event.duration) : event.timestamp,
			group: event.agentId,
			content: event.action,
			data: {
				input: event.input,
				output: event.output
			}
		}));
	}

	// Find patterns and anomalies

	findPatterns(): any[] {
		const patterns: any[] = [];
		
		// Group events by agent-action pairs
		const agentActionPairs: Record<string, TraceEvent[]> = {};
		
		this.events.forEach(event => {
			const key = `${event.agentId}-${event.action}`;
			if (!agentActionPairs[key]) {
				agentActionPairs[key] = [];
			}
			agentActionPairs[key].push(event);
		});

		// Find frequent patterns
		Object.entries(agentActionPairs).forEach(([key, events]) => {
			if (events.length > 1) {
				const [agentId, action] = key.split('-');
				patterns.push({
					type: 'frequent_pattern',
					agentId,
					action,
					count: events.length,
					firstOccurrence: events[0].timestamp,
					lastOccurrence: events[events.length - 1].timestamp
				});
			}
		});

		return patterns;
	}

	findAnomalies(): any[] {
		const anomalies: any[] = [];
		const durationStats = this.getDurationStats();
		
		// Find events with unusually long durations
		if (durationStats.avg > 0) {
			const threshold = durationStats.avg * 3; // 3x average duration
			this.events.forEach(event => {
				if (event.duration && event.duration > threshold) {
					anomalies.push({
						type: 'long_duration',
						eventId: event.id,
						agentId: event.agentId,
						action: event.action,
						duration: event.duration,
						threshold: threshold,
						timestamp: event.timestamp
					});
				}
			});
		}

		return anomalies;
	}

	// Private helper methods

	private notifyObservers(event: TraceEvent): void {
		this.observers.forEach(observer => {
			try {
				observer(event);
			} catch (error) {
				console.warn('Trace observer error:', error);
			}
		});
	}

	private notifyReplayObservers(event: TraceEvent): void {
		this.replayObservers.forEach(observer => {
			try {
				observer(event);
			} catch (error) {
				console.warn('Replay observer error:', error);
			}
		});
	}
}