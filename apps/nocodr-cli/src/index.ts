#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { version } from '../package.json';

const program = new Command();

program
	.name('nocodr')
	.description('NoCodr CLI - Professional AI coding assistant with DevOps tools')
	.version(version)
	.option('-v, --verbose', 'Enable verbose output')
	.hook('preAction', (thisCommand) => {
		if (thisCommand.opts().verbose) {
			console.log(chalk.gray(`NoCodr CLI v${version}`));
			console.log(chalk.gray('Professional AI coding assistant with DevOps tools'));
			console.log();
		}
	});

// nocodr init - Scaffold new project
program
	.command('init')
	.description('Initialize a new NoCodr project')
	.argument('[directory]', 'Project directory', '.')
	.option('-t, --template <template>', 'Project template to use')
	.action((directory, options) => {
		console.log(chalk.green('Initializing NoCodr project...'));
		console.log(`Directory: ${directory}`);
		if (options.template) {
			console.log(`Template: ${options.template}`);
		}
		console.log(chalk.yellow('This command is not yet implemented.'));
	});

// nocodr up - Start runtime + UI
program
	.command('up')
	.description('Start NoCodr runtime and UI')
	.option('-p, --port <port>', 'Port to run the UI on', '3000')
	.option('--headless', 'Run in headless mode')
	.action((options) => {
		console.log(chalk.green('Starting NoCodr runtime...'));
		console.log(`Port: ${options.port}`);
		if (options.headless) {
			console.log('Running in headless mode');
		}
		console.log(chalk.yellow('This command is not yet implemented.'));
	});

// nocodr run <file> - Execute Agent Graph flow
program
	.command('run')
	.description('Execute an Agent Graph flow')
	.argument('<file>', 'Path to the .nflow file')
	.option('--watch', 'Watch for file changes and re-run')
	.action((file, options) => {
		console.log(chalk.green(`Executing Agent Graph: ${file}`));
		if (options.watch) {
			console.log('Watching for changes...');
		}
		console.log(chalk.yellow('This command is not yet implemented.'));
	});

// nocodr live - Start live collaboration
program
	.command('live')
	.description('Start live collaboration session')
	.option('--host <host>', 'Host to bind to', 'localhost')
	.option('--port <port>', 'Port to run the collaboration server on', '3001')
	.action((options) => {
		console.log(chalk.green('Starting live collaboration session...'));
		console.log(`Host: ${options.host}`);
		console.log(`Port: ${options.port}`);
		console.log(chalk.yellow('This command is not yet implemented.'));
	});

// nocodr verify - Run self-verification
program
	.command('verify')
	.description('Run NoCodr self-verification')
	.option('--full', 'Run full verification suite')
	.action((options) => {
		console.log(chalk.green('Running NoCodr self-verification...'));
		if (options.full) {
			console.log('Running full verification suite');
		}
		console.log(chalk.yellow('This command is not yet implemented.'));
	});

// nocodr models - Manage provider configurations
program
	.command('models')
	.description('Manage AI model provider configurations')
	.option('--list', 'List configured providers')
	.option('--add <provider>', 'Add a new provider')
	.option('--remove <provider>', 'Remove a provider')
	.action((options) => {
		console.log(chalk.green('Managing AI model providers...'));
		if (options.list) {
			console.log('Listing configured providers...');
		}
		if (options.add) {
			console.log(`Adding provider: ${options.add}`);
		}
		if (options.remove) {
			console.log(`Removing provider: ${options.remove}`);
		}
		console.log(chalk.yellow('This command is not yet implemented.'));
	});

// Add compatibility alias for kilo up
program
	.command('kilo', { hidden: true })
	.description('NoCodr compatibility commands')
	.argument('<command...>')
	.action((command) => {
		if (command[0] === 'up') {
			console.log(chalk.yellow('Warning: Using deprecated "kilo up" command. Please use "nocodr up" instead.'));
			// Forward to nocodr up command
			program.parse(['up'], { from: 'user' });
		} else {
			console.log(chalk.red(`Unknown kilo command: ${command.join(' ')}`));
			console.log('Use "nocodr --help" for available commands.');
			process.exit(1);
		}
	});

program.parse();