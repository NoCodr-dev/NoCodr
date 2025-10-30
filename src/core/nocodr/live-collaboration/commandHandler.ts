import * as vscode from "vscode"
import { LiveCollaborationService } from "./LiveCollaborationService"

export class LiveCollaborationCommandHandler {
    private collaborationService: LiveCollaborationService

    constructor() {
        this.collaborationService = LiveCollaborationService.getInstance()
    }

    /**
     * Handle start collaboration session command
     */
    public async handleStartSession(): Promise<void> {
        try {
            const host = await vscode.window.showInputBox({
                prompt: "Enter host (default: localhost)",
                value: "localhost"
            }) || "localhost"

            const portStr = await vscode.window.showInputBox({
                prompt: "Enter port (default: 3001)",
                value: "3001"
            }) || "3001"

            const port = parseInt(portStr, 10)

            const session = await this.collaborationService.startSession({ host, port })
            
            vscode.window.showInformationMessage(
                `Collaboration session started! Session ID: ${session.sessionId}`
            )
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start collaboration session: ${error.message}`)
        }
    }

    /**
     * Handle join collaboration session command
     */
    public async handleJoinSession(): Promise<void> {
        try {
            const sessionId = await vscode.window.showInputBox({
                prompt: "Enter session ID to join",
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return "Session ID cannot be empty"
                    }
                    return null
                }
            })

            if (!sessionId) {
                return
            }

            const host = await vscode.window.showInputBox({
                prompt: "Enter host (default: localhost)",
                value: "localhost"
            }) || "localhost"

            const portStr = await vscode.window.showInputBox({
                prompt: "Enter port (default: 3001)",
                value: "3001"
            }) || "3001"

            const port = parseInt(portStr, 10)

            const session = await this.collaborationService.joinSession(sessionId, host, port)
            
            vscode.window.showInformationMessage(
                `Joined collaboration session: ${session.sessionId}`
            )
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to join collaboration session: ${error.message}`)
        }
    }

    /**
     * Handle leave collaboration session command
     */
    public async handleLeaveSession(): Promise<void> {
        try {
            await this.collaborationService.leaveSession()
            vscode.window.showInformationMessage("Left collaboration session")
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to leave collaboration session: ${error.message}`)
        }
    }

    /**
     * Handle share current document command
     */
    public async handleShareDocument(): Promise<void> {
        try {
            const editor = vscode.window.activeTextEditor
            if (!editor) {
                vscode.window.showErrorMessage("No active document to share")
                return
            }

            await this.collaborationService.shareDocument(editor.document.uri)
            vscode.window.showInformationMessage(
                `Document shared for collaboration: ${editor.document.fileName}`
            )
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to share document: ${error.message}`)
        }
    }

    /**
     * Handle unshare current document command
     */
    public async handleUnshareDocument(): Promise<void> {
        try {
            const editor = vscode.window.activeTextEditor
            if (!editor) {
                vscode.window.showErrorMessage("No active document to unshare")
                return
            }

            await this.collaborationService.unshareDocument(editor.document.uri)
            vscode.window.showInformationMessage(
                `Document removed from collaboration: ${editor.document.fileName}`
            )
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to unshare document: ${error.message}`)
        }
    }

    /**
     * Handle show collaboration status command
     */
    public async handleShowStatus(): Promise<void> {
        try {
            const session = this.collaborationService.getSession()
            if (!session) {
                vscode.window.showInformationMessage("No active collaboration session")
                return
            }

            const participants = this.collaborationService.getParticipants()
            const documents = this.collaborationService.getSharedDocuments()

            let output = `# Collaboration Session Status\n\n`
            output += `**Session ID:** ${session.sessionId}\n`
            output += `**Host:** ${session.host}:${session.port}\n`
            output += `**Created:** ${session.createdAt.toLocaleString()}\n\n`
            
            output += `## Participants (${participants.length})\n`
            if (participants.length > 0) {
                for (const participant of participants) {
                    output += `- ${participant.name} (${participant.id})\n`
                }
            } else {
                output += "No participants\n"
            }
            
            output += `\n## Shared Documents (${documents.length})\n`
            if (documents.length > 0) {
                for (const doc of documents) {
                    output += `- ${doc.uri.toString()}\n`
                }
            } else {
                output += "No shared documents\n"
            }

            // Show output in a new document
            await this.showOutputInDocument("Collaboration Status", output)
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show collaboration status: ${error.message}`)
        }
    }

    /**
     * Show output in a new document
     */
    private async showOutputInDocument(title: string, content: string): Promise<void> {
        const document = await vscode.workspace.openTextDocument({
            content: content,
            language: "markdown"
        })
        
        await vscode.window.showTextDocument(document, {
            preview: false
        })
    }
}