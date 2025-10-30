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

import * as vscode from "vscode"
import { NoCodrCommandHandler } from "./commandHandler"
import { registerLiveCollaborationCommands } from "./live-collaboration/registerCommands"

export interface NoCodrCommandOptions {
    context: vscode.ExtensionContext
    outputChannel: vscode.OutputChannel
}

/**
 * Register NoCodr-specific commands that extend Kilo Code functionality
 */
export const registerNoCodrCommands = (options: NoCodrCommandOptions) => {
    const { context, outputChannel } = options
    const commandHandler = new NoCodrCommandHandler()
    
    // Docker commands
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.docker.listContainers", async () => {
            await commandHandler.handleListDockerContainers()
        })
    )
    
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.docker.listImages", async () => {
            await commandHandler.handleListDockerImages()
        })
    )
    
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.docker.listNetworks", async () => {
            await commandHandler.handleListDockerNetworks()
        })
    )
    
    // Database commands
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.database.listConnections", async () => {
            await commandHandler.handleListDatabaseConnections()
        })
    )
    
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.database.executeQuery", async () => {
            await commandHandler.handleExecuteDatabaseQuery()
        })
    )
    
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.database.connect", async () => {
            // This would open a connection wizard in a real implementation
            vscode.window.showInformationMessage("Database connection wizard would open here. Configure connections in NoCoder settings.")
        })
    )
    
    // API testing commands
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.api.listEndpoints", async () => {
            await commandHandler.handleListApiEndpoints()
        })
    )
    
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.api.testEndpoint", async () => {
            await commandHandler.handleTestApiEndpoint()
        })
    )
    
    // Security scanning commands
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.security.scanVulnerabilities", async () => {
            await commandHandler.handleScanVulnerabilities()
        })
    )
    
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.security.scanSecrets", async () => {
            await commandHandler.handleScanSecrets()
        })
    )
    
    // Register live collaboration commands
    registerLiveCollaborationCommands(options)
    
    outputChannel.appendLine("NoCodr commands registered successfully")
}