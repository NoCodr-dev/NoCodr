// Copyright 2025 NoCoder Inc.
// SPDX-License-Identifier: Apache-2.0

import { Agent, AgentRole, AgentStatus, Task } from './types';
import { SharedMemory } from './memory';

export interface AgentContext {
	memory: SharedMemory;
	previousResults: Record<string, any>;
	taskHistory: Task[];
}

export abstract class BaseAgent implements Agent {
	id: string;
	name: string;
	role: AgentRole;
	status: AgentStatus;
	capabilities: string[];
	protected context: AgentContext;

	constructor(id: string, name: string, role: AgentRole, capabilities: string[] = []) {
		this.id = id;
		this.name = name;
		this.role = role;
		this.status = 'idle';
		this.capabilities = capabilities;
		this.context = {
			memory: new SharedMemory(),
			previousResults: {},
			taskHistory: []
		};
	}

	async executeTask(task: Task, context?: AgentContext): Promise<any> {
		this.status = 'busy';
		try {
			if (context) {
				this.context = context;
			}
			
			const result = await this.processTask(task);
			this.status = 'idle';
			return result;
		} catch (error) {
			this.status = 'error';
			throw error;
		}
	}

	protected abstract processTask(task: Task): Promise<any>;

	getStatus(): AgentStatus {
		return this.status;
	}

	setStatus(status: AgentStatus): void {
		this.status = status;
	}

	getContext(): AgentContext {
		return this.context;
	}

	updateContext(context: AgentContext): void {
		this.context = context;
	}
}

export class PlannerAgent extends BaseAgent {
	constructor(id: string) {
		super(id, 'Planner', 'planner', ['task-planning', 'workflow-design', 'requirement-analysis', 'project-structuring']);
	}

	protected async processTask(task: Task): Promise<any> {
		// Advanced planning logic
		const requirements = this.analyzeRequirements(task.description);
		const breakdown = this.breakDownTask(task.description);
		const timeline = this.estimateTimeline(breakdown);
		const dependencies = this.identifyDependencies(breakdown);
		
		return {
			plan: {
				taskId: task.id,
				objective: task.description,
				requirements,
				breakdown,
				timeline,
				dependencies,
				toolsNeeded: ['coder', 'tester', 'debugger'],
				successCriteria: ['Code implementation', 'Tests passing', 'Documentation']
			},
			metadata: {
				agent: this.id,
				timestamp: new Date().toISOString(),
				complexity: this.assessComplexity(task.description)
			}
		};
	}

	private analyzeRequirements(description: string): string[] {
		// Simple requirement analysis - in real implementation, this would use LLM
		const keywords = ['api', 'database', 'ui', 'authentication', 'testing'];
		const requirements = keywords.filter(keyword => 
			description.toLowerCase().includes(keyword)
		);
		return requirements.length > 0 ? requirements : ['general-implementation'];
	}

	private breakDownTask(description: string): any[] {
		// Simple task breakdown
		const complexity = this.assessComplexity(description);
		const steps = complexity > 0.7 ? 5 : complexity > 0.4 ? 3 : 2;
		
		return Array.from({ length: steps }, (_, i) => ({
			id: `step-${i + 1}`,
			title: `Step ${i + 1}`,
			description: `Implementation step ${i + 1} for ${description}`,
			estimatedTime: `${15 * (i + 1)} minutes`,
			requiredSkills: ['programming']
		}));
	}

	private estimateTimeline(breakdown: any[]): any {
		const totalMinutes = breakdown.reduce((sum, step) => {
			const timeStr = step.estimatedTime;
			const minutes = parseInt(timeStr) || 30;
			return sum + minutes;
		}, 0);

		return {
			totalEstimatedTime: `${Math.ceil(totalMinutes / 60)} hours`,
			startDate: new Date().toISOString(),
			endDate: new Date(Date.now() + totalMinutes * 60000).toISOString(),
			milestones: breakdown.map((step, i) => ({
				id: `milestone-${i + 1}`,
				title: step.title,
				dueDate: new Date(Date.now() + (i + 1) * (totalMinutes / breakdown.length) * 60000).toISOString()
			}))
		};
	}

	private identifyDependencies(breakdown: any[]): any[] {
		// Simple dependency identification
		return breakdown.slice(1).map((step, i) => ({
			taskId: step.id,
			dependsOn: [breakdown[i].id],
			type: 'sequential'
		}));
	}

	private assessComplexity(description: string): number {
		// Simple complexity assessment
		const length = description.length;
		const keywords = ['complex', 'advanced', 'difficult', 'challenging'];
		const hasComplexKeywords = keywords.some(keyword => 
			description.toLowerCase().includes(keyword)
		);
		
		let score = Math.min(length / 100, 1);
		if (hasComplexKeywords) score += 0.2;
		
		return Math.min(score, 1);
	}
}

export class CoderAgent extends BaseAgent {
	constructor(id: string) {
		super(id, 'Coder', 'coder', ['code-generation', 'implementation', 'refactoring', 'debugging', 'optimization']);
	}

	protected async processTask(task: Task): Promise<any> {
		// Get plan from memory if available
		const plan = this.context.memory.get(`task-plan-${task.id}`);
		
		// Generate code based on task and plan
		const implementation = this.generateImplementation(task.description, plan);
		const files = this.organizeFiles(implementation);
		const documentation = this.generateDocumentation(task.description, implementation);
		
		return {
			code: {
				taskId: task.id,
				implementation,
				files,
				documentation,
				language: this.detectLanguage(task.description),
				framework: this.detectFramework(task.description)
			},
			metadata: {
				agent: this.id,
				timestamp: new Date().toISOString(),
				linesOfCode: implementation.split('\n').length
			}
		};
	}

	private generateImplementation(description: string, plan?: any): string {
		// Simple code generation - in real implementation, this would use LLM
		const language = this.detectLanguage(description);
		const framework = this.detectFramework(description);
		
		if (language === 'typescript') {
			return `// Implementation for: ${description}
import { Component } from '@angular/core';

@Component({
	selector: 'app-${this.generateComponentName(description)}',
	templateUrl: './${this.generateComponentName(description)}.component.html',
	styleUrls: ['./${this.generateComponentName(description)}.component.css']
})
export class ${this.generateClassName(description)} {
	constructor() {
		// TODO: Implement constructor logic
	}
	
	// TODO: Add component methods here
}`;
		} else if (language === 'python') {
			return `# Implementation for: ${description}

class ${this.generateClassName(description)}:
	def __init__(self):
		# TODO: Implement constructor logic
		pass
	
	def execute(self):
		# TODO: Add implementation logic
		pass`;
		} else {
			return `// Generic implementation for: ${description}
function ${this.generateFunctionName(description)}() {
	// TODO: Implement logic for ${description}
	console.log('Implementing: ${description}');
}`;
		}
	}

	private organizeFiles(implementation: string): any[] {
		// Simple file organization
		return [
			{
				path: 'src/index.ts',
				content: implementation,
				type: 'main'
			},
			{
				path: 'src/types.ts',
				content: '// Type definitions\nexport interface Task {}',
				type: 'types'
			},
			{
				path: 'src/utils.ts',
				content: '// Utility functions\nexport function helper() {}',
				type: 'utils'
			}
		];
	}

	private generateDocumentation(description: string, implementation: string): string {
		return `# ${description}

## Overview
This implementation provides functionality for ${description}.

## Usage
\`\`\`typescript
// Example usage
const instance = new ${this.generateClassName(description)}();
\`\`\`

## API
- Constructor: Initializes the component
- Methods: Various methods for ${description.toLowerCase()}

## Dependencies
- None
`;
	}

	private detectLanguage(description: string): string {
		const keywords = {
			python: ['python', 'django', 'flask', 'fastapi'],
			javascript: ['javascript', 'node', 'react', 'vue'],
			typescript: ['typescript', 'angular', 'nestjs'],
			java: ['java', 'spring'],
			go: ['go', 'golang']
		};

		for (const [language, terms] of Object.entries(keywords)) {
			if (terms.some(term => description.toLowerCase().includes(term))) {
				return language;
			}
		}

		return 'typescript'; // default
	}

	private detectFramework(description: string): string {
		const frameworks = ['angular', 'react', 'vue', 'nestjs', 'express', 'django', 'flask'];
		return frameworks.find(framework => 
			description.toLowerCase().includes(framework)
		) || 'none';
	}

	private generateComponentName(description: string): string {
		return description.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'component';
	}

	private generateClassName(description: string): string {
		return description.split(' ')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join('') || 'Implementation';
	}

	private generateFunctionName(description: string): string {
		return description.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_+|_+$/g, '') || 'execute';
	}
}

export class DebuggerAgent extends BaseAgent {
	constructor(id: string) {
		super(id, 'Debugger', 'debugger', ['error-detection', 'bug-fixing', 'troubleshooting', 'performance-analysis']);
	}

	protected async processTask(task: Task): Promise<any> {
		// Get code from memory if available
		const codeResult = this.context.memory.get(`task-code-${task.id}`);
		
		// Analyze code for potential issues
		const issues = this.analyzeCode(codeResult?.implementation || task.description);
		const fixes = this.suggestFixes(issues);
		const diagnostics = this.generateDiagnostics(issues);
		
		return {
			debug: {
				taskId: task.id,
				issues,
				fixes,
				diagnostics,
				severity: this.assessSeverity(issues)
			},
			metadata: {
				agent: this.id,
				timestamp: new Date().toISOString(),
				issuesFound: issues.length
			}
		};
	}

	private analyzeCode(code: string): any[] {
		// Simple static analysis
		const issues: any[] = [];
		
		// Check for common issues
		if (code.includes('TODO:')) {
			issues.push({
				id: 'todo-found',
				type: 'warning',
				message: 'TODO comments found in code',
				line: this.findLineWithText(code, 'TODO:'),
				suggestion: 'Implement the TODO functionality'
			});
		}
		
		if (code.includes('console.log')) {
			issues.push({
				id: 'console-log-found',
				type: 'info',
				message: 'Debug console.log statements found',
				line: this.findLineWithText(code, 'console.log'),
				suggestion: 'Remove or replace with proper logging'
			});
		}
		
		if (!code.includes('error') && code.includes('try')) {
			issues.push({
				id: 'missing-error-handling',
				type: 'warning',
				message: 'Try blocks found without apparent error handling',
				line: this.findLineWithText(code, 'try'),
				suggestion: 'Add proper error handling'
			});
		}
		
		return issues;
	}

	private suggestFixes(issues: any[]): any[] {
		return issues.map(issue => ({
			...issue,
			fix: `Fix for ${issue.message}: Implement proper solution`,
			estimatedTime: '30 minutes'
		}));
	}

	private generateDiagnostics(issues: any[]): string {
		if (issues.length === 0) {
			return 'No issues found during static analysis.';
		}
		
		const severityCounts = issues.reduce((acc, issue) => {
			acc[issue.type] = (acc[issue.type] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		
		return `Code Analysis Results:
- Errors: ${severityCounts.error || 0}
- Warnings: ${severityCounts.warning || 0}
- Info: ${severityCounts.info || 0}
- Total Issues: ${issues.length}`;
	}

	private assessSeverity(issues: any[]): string {
		const hasErrors = issues.some(issue => issue.type === 'error');
		const hasWarnings = issues.some(issue => issue.type === 'warning');
		
		if (hasErrors) return 'high';
		if (hasWarnings) return 'medium';
		return 'low';
	}

	private findLineWithText(text: string, search: string): number {
		const lines = text.split('\n');
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].includes(search)) {
				return i + 1;
			}
		}
		return 0;
	}
}

export class TesterAgent extends BaseAgent {
	constructor(id: string) {
		super(id, 'Tester', 'tester', ['test-writing', 'test-execution', 'quality-assurance', 'coverage-analysis']);
	}

	protected async processTask(task: Task): Promise<any> {
		// Get code and plan from memory
		const codeResult = this.context.memory.get(`task-code-${task.id}`);
		const plan = this.context.memory.get(`task-plan-${task.id}`);
		
		// Generate test cases
		const testCases = this.generateTestCases(task.description, codeResult, plan);
		const testSuite = this.organizeTestSuite(testCases);
		const coverage = this.estimateCoverage(testCases);
		
		return {
			tests: {
				taskId: task.id,
				testCases,
				testSuite,
				coverage,
				executionPlan: this.createExecutionPlan(testCases)
			},
			metadata: {
				agent: this.id,
				timestamp: new Date().toISOString(),
				testCount: testCases.length
			}
		};
	}

	private generateTestCases(description: string, codeResult?: any, plan?: any): any[] {
		// Generate test cases based on task description
		const functionality = this.extractFunctionality(description);
		
		return [
			{
				id: 'test-1',
				name: `should ${functionality} correctly`,
				type: 'unit',
				input: {},
				expected: {},
				framework: 'jest'
			},
			{
				id: 'test-2',
				name: `should handle edge cases for ${functionality}`,
				type: 'unit',
				input: { edgeCase: true },
				expected: { handled: true },
				framework: 'jest'
			},
			{
				id: 'test-3',
				name: `should maintain performance for ${functionality}`,
				type: 'performance',
				input: { largeDataSet: true },
				expected: { responseTime: '< 100ms' },
				framework: 'jest'
			}
		];
	}

	private organizeTestSuite(testCases: any[]): any {
		return {
			unitTests: testCases.filter(tc => tc.type === 'unit'),
			integrationTests: testCases.filter(tc => tc.type === 'integration'),
			performanceTests: testCases.filter(tc => tc.type === 'performance'),
			securityTests: testCases.filter(tc => tc.type === 'security')
		};
	}

	private estimateCoverage(testCases: any[]): any {
		const totalFunctions = Math.max(testCases.length, 1);
		const testedFunctions = testCases.filter(tc => tc.type === 'unit').length;
		const coveragePercentage = Math.round((testedFunctions / totalFunctions) * 100);
		
		return {
			percentage: `${coveragePercentage}%`,
			lines: coveragePercentage > 80 ? 'high' : coveragePercentage > 50 ? 'medium' : 'low',
			branches: coveragePercentage > 70 ? 'high' : 'medium',
			functions: 'high'
		};
	}

	private createExecutionPlan(testCases: any[]): any[] {
		return testCases.map((testCase, index) => ({
			id: testCase.id,
			order: index + 1,
			dependencies: index > 0 ? [`test-${index}`] : [],
			timeout: '30s',
			retry: 2
		}));
	}

	private extractFunctionality(description: string): string {
		const verbs = ['create', 'update', 'delete', 'validate', 'process', 'generate'];
		const verb = verbs.find(v => description.toLowerCase().includes(v)) || 'execute';
		return verb;
	}
}

export class VerifierAgent extends BaseAgent {
	constructor(id: string) {
		super(id, 'Verifier', 'verifier', ['verification', 'validation', 'quality-check', 'compliance']);
	}

	protected async processTask(task: Task): Promise<any> {
		// Get results from other agents
		const plan = this.context.memory.get(`task-plan-${task.id}`);
		const code = this.context.memory.get(`task-code-${task.id}`);
		const tests = this.context.memory.get(`task-tests-${task.id}`);
		const debug = this.context.memory.get(`task-debug-${task.id}`);
		
		// Verify all aspects
		const verification = this.verifyImplementation(task, plan, code, tests, debug);
		const qualityScore = this.calculateQualityScore(verification);
		const recommendations = this.generateRecommendations(verification);
		
		return {
			verification: {
				taskId: task.id,
				results: verification,
				qualityScore,
				recommendations,
				finalStatus: qualityScore > 80 ? 'approved' : 'needs-review'
			},
			metadata: {
				agent: this.id,
				timestamp: new Date().toISOString(),
				score: qualityScore
			}
		};
	}

	private verifyImplementation(task: Task, plan: any, code: any, tests: any, debug: any): any {
		return {
			planVerification: this.verifyPlan(plan),
			codeVerification: this.verifyCode(code),
			testVerification: this.verifyTests(tests),
			debugVerification: this.verifyDebug(debug),
			overallCompliance: this.checkCompliance(task, plan, code, tests)
		};
	}

	private verifyPlan(plan: any): any {
		const checks = [
			{ name: 'Has clear objectives', passed: !!plan?.plan?.objective },
			{ name: 'Has breakdown steps', passed: Array.isArray(plan?.plan?.breakdown) && plan.plan.breakdown.length > 0 },
			{ name: 'Has timeline', passed: !!plan?.plan?.timeline },
			{ name: 'Has dependencies', passed: Array.isArray(plan?.plan?.dependencies) }
		];
		
		return {
			checks,
			score: checks.filter(c => c.passed).length / checks.length * 100,
			status: checks.every(c => c.passed) ? 'passed' : 'failed'
		};
	}

	private verifyCode(code: any): any {
		const checks = [
			{ name: 'Code exists', passed: !!code?.code?.implementation },
			{ name: 'Has files', passed: Array.isArray(code?.code?.files) && code.code.files.length > 0 },
			{ name: 'Has documentation', passed: !!code?.code?.documentation },
			{ name: 'Has language specified', passed: !!code?.code?.language }
		];
		
		return {
			checks,
			score: checks.filter(c => c.passed).length / checks.length * 100,
			status: checks.every(c => c.passed) ? 'passed' : 'failed'
		};
	}

	private verifyTests(tests: any): any {
		const checks = [
			{ name: 'Tests exist', passed: !!tests?.tests?.testCases },
			{ name: 'Has test suite', passed: !!tests?.tests?.testSuite },
			{ name: 'Has coverage data', passed: !!tests?.tests?.coverage },
			{ name: 'Has execution plan', passed: !!tests?.tests?.executionPlan }
		];
		
		return {
			checks,
			score: checks.filter(c => c.passed).length / checks.length * 100,
			status: checks.every(c => c.passed) ? 'passed' : 'failed'
		};
	}

	private verifyDebug(debug: any): any {
		const checks = [
			{ name: 'Debug analysis performed', passed: !!debug?.debug },
			{ name: 'Issues identified', passed: Array.isArray(debug?.debug?.issues) },
			{ name: 'Has diagnostics', passed: !!debug?.debug?.diagnostics }
		];
		
		return {
			checks,
			score: checks.filter(c => c.passed).length / checks.length * 100,
			status: checks.every(c => c.passed) ? 'passed' : 'failed'
		};
	}

	private checkCompliance(task: Task, plan: any, code: any, tests: any): any {
		return {
			requirements: 'met',
			standards: 'compliant',
			security: 'reviewed',
			performance: 'acceptable'
		};
	}

	private calculateQualityScore(verification: any): number {
		const scores = [
			verification.planVerification.score,
			verification.codeVerification.score,
			verification.testVerification.score,
			verification.debugVerification.score
		];
		
		return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
	}

	private generateRecommendations(verification: any): string[] {
		const recommendations: string[] = [];
		
		if (verification.planVerification.score < 80) {
			recommendations.push('Improve planning documentation with more detailed breakdown');
		}
		
		if (verification.codeVerification.score < 80) {
			recommendations.push('Enhance code quality with better structure and documentation');
		}
		
		if (verification.testVerification.score < 80) {
			recommendations.push('Increase test coverage and add more comprehensive test cases');
		}
		
		if (verification.debugVerification.score < 80) {
			recommendations.push('Perform more thorough debugging and issue analysis');
		}
		
		return recommendations.length > 0 ? recommendations : ['Implementation meets quality standards'];
	}
}