import * as vscode from "vscode"
import { CollaborationServer } from "./CollaborationServer"
import { TextChange, Operation } from "./LiveCollaborationService"

export class DocumentSyncManager {
    private syncedDocuments: Map<string, boolean> = new Map()
    private pendingChanges: Map<string, TextChange[]> = new Map()
    private outputChannel: vscode.OutputChannel

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel("NoCodr Document Sync")
    }

    /**
     * Start syncing a document
     */
    public async startSync(uri: vscode.Uri, server: CollaborationServer): Promise<void> {
        const documentKey = uri.toString()
        this.syncedDocuments.set(documentKey, true)
        this.outputChannel.appendLine(`Started syncing document: ${documentKey}`)
    }

    /**
     * Stop syncing a document
     */
    public async stopSync(uri: vscode.Uri): Promise<void> {
        const documentKey = uri.toString()
        this.syncedDocuments.delete(documentKey)
        this.pendingChanges.delete(documentKey)
        this.outputChannel.appendLine(`Stopped syncing document: ${documentKey}`)
    }

    /**
     * Send document changes to other participants
     */
    public async sendChanges(event: vscode.TextDocumentChangeEvent, server: CollaborationServer): Promise<void> {
        const documentKey = event.document.uri.toString()
        
        if (!this.syncedDocuments.has(documentKey)) {
            return
        }

        // Convert VS Code text changes to our format
        for (const change of event.contentChanges) {
            const textChange: TextChange = {
                id: this.generateChangeId(),
                participantId: this.getCurrentParticipantId(),
                documentUri: event.document.uri,
                timestamp: new Date(),
                operation: this.convertContentChangeToOperation(change)
            }

            // Send the change to the server
            const sessionId = this.getCurrentSessionId()
            if (sessionId) {
                await server.sendTextChange(textChange, sessionId)
            }
        }
    }

    /**
     * Apply incoming changes to a document
     */
    public async applyChanges(changes: TextChange[], uri: vscode.Uri): Promise<void> {
        const document = await vscode.workspace.openTextDocument(uri)
        const editor = await vscode.window.showTextDocument(document)
        
        // Apply changes in order
        for (const change of changes) {
            await this.applyChange(change, editor)
        }
    }

    /**
     * Apply a single change to a document
     */
    private async applyChange(change: TextChange, editor: vscode.TextEditor): Promise<void> {
        const edit = new vscode.WorkspaceEdit()
        
        switch (change.operation.type) {
            case "insert":
                if (change.operation.text) {
                    edit.insert(
                        change.documentUri,
                        change.operation.position,
                        change.operation.text
                    )
                }
                break
            case "delete":
                if (change.operation.length) {
                    const endPosition = this.calculateEndPosition(
                        change.operation.position,
                        change.operation.length
                    )
                    edit.delete(
                        change.documentUri,
                        new vscode.Range(change.operation.position, endPosition)
                    )
                }
                break
            case "replace":
                if (change.operation.text) {
                    const endPosition = this.calculateEndPosition(
                        change.operation.position,
                        change.operation.length || change.operation.text.length
                    )
                    edit.replace(
                        change.documentUri,
                        new vscode.Range(change.operation.position, endPosition),
                        change.operation.text
                    )
                }
                break
        }

        try {
            await vscode.workspace.applyEdit(edit)
            this.outputChannel.appendLine(`Applied change ${change.id} to document`)
        } catch (error) {
            this.outputChannel.appendLine(`Failed to apply change ${change.id}: ${error.message}`)
        }
    }

    /**
     * Convert VS Code content change to our operation format
     */
    private convertContentChangeToOperation(change: vscode.TextDocumentContentChangeEvent): Operation {
        if (change.text === "") {
            // Deletion
            return {
                type: "delete",
                position: change.range.start,
                length: change.rangeLength
            }
        } else if (change.rangeLength === 0) {
            // Insertion
            return {
                type: "insert",
                position: change.range.start,
                text: change.text
            }
        } else {
            // Replacement
            return {
                type: "replace",
                position: change.range.start,
                text: change.text,
                length: change.rangeLength
            }
        }
    }

    /**
     * Calculate end position based on start position and length
     */
    private calculateEndPosition(start: vscode.Position, length: number): vscode.Position {
        // This is a simplified implementation
        // In a real CRDT/OT system, this would be more sophisticated
        return new vscode.Position(
            start.line,
            start.character + length
        )
    }

    /**
     * Generate a unique change ID
     */
    private generateChangeId(): string {
        return "change_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    }

    /**
     * Get current participant ID (simplified implementation)
     */
    private getCurrentParticipantId(): string {
        // In a real implementation, this would come from authentication
        return "participant_" + vscode.env.machineId
    }

    /**
     * Get current session ID (simplified implementation)
     */
    private getCurrentSessionId(): string | null {
        // In a real implementation, this would come from the session manager
        return "session_123"
    }

    /**
     * Check if a document is being synced
     */
    public isSyncing(uri: vscode.Uri): boolean {
        return this.syncedDocuments.has(uri.toString())
    }
}