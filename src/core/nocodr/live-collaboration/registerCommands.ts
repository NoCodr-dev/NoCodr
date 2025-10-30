import * as vscode from "vscode"
import { LiveCollaborationCommandHandler } from "./commandHandler"

export interface LiveCollaborationCommandOptions {
    context: vscode.ExtensionContext
    outputChannel: vscode.OutputChannel
}

/**
 * Register NoCodr Live Collaboration commands
 */
export const registerLiveCollaborationCommands = (options: LiveCollaborationCommandOptions) => {
    const { context, outputChannel } = options
    const commandHandler = new LiveCollaborationCommandHandler()
    
    // Start collaboration session
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.live.startSession", async () => {
            await commandHandler.handleStartSession()
        })
    )
    
    // Join collaboration session
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.live.joinSession", async () => {
            await commandHandler.handleJoinSession()
        })
    )
    
    // Leave collaboration session
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.live.leaveSession", async () => {
            await commandHandler.handleLeaveSession()
        })
    )
    
    // Share current document
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.live.shareDocument", async () => {
            await commandHandler.handleShareDocument()
        })
    )
    
    // Unshare current document
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.live.unshareDocument", async () => {
            await commandHandler.handleUnshareDocument()
        })
    )
    
    // Show collaboration status
    context.subscriptions.push(
        vscode.commands.registerCommand("nocodr.live.showStatus", async () => {
            await commandHandler.handleShowStatus()
        })
    )
    
    outputChannel.appendLine("NoCodr Live Collaboration commands registered successfully")
}