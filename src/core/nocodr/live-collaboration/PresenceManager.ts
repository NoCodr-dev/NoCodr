import * as vscode from "vscode"
import { CollaborationServer } from "./CollaborationServer"
import { Participant } from "./LiveCollaborationService"

export interface ActivityIndicator {
    participantId: string
    activityType: "typing" | "idle" | "away" | "focused"
    timestamp: Date
    documentUri?: vscode.Uri
}

export class PresenceManager {
    private participants: Map<string, Participant> = new Map()
    private activityIndicators: Map<string, ActivityIndicator> = new Map()
    private cursorDecorations: Map<string, vscode.TextEditorDecorationType> = new Map()
    private outputChannel: vscode.OutputChannel

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel("NoCodr Presence")
    }

    /**
     * Send activity indicator for a participant
     */
    public async sendActivityIndicator(
        activityType: "typing" | "idle" | "away" | "focused",
        server: CollaborationServer,
        sessionId: string,
        documentUri?: vscode.Uri
    ): Promise<void> {
        const indicator: ActivityIndicator = {
            participantId: this.getCurrentParticipantId(),
            activityType,
            timestamp: new Date(),
            documentUri
        }

        // Update local activity data
        this.activityIndicators.set(indicator.participantId, indicator)

        // Send to server
        // In a real implementation, this would be sent to the server
        this.outputChannel.appendLine(`Activity indicator: ${activityType} for participant ${indicator.participantId}`)
    }

    /**
     * Send presence update for a participant
     */
    public async sendPresenceUpdate(
        editor: vscode.TextEditor,
        server: CollaborationServer,
        sessionId: string
    ): Promise<void> {
        const participant: Participant = {
            id: this.getCurrentParticipantId(),
            name: this.getCurrentParticipantName(),
            color: this.generateParticipantColor(),
            cursorPosition: editor.selection.active,
            selection: editor.selection,
            isActive: true
        }

        // Update local participant data
        this.participants.set(participant.id, participant)

        // Send to server
        await server.sendPresenceUpdate(participant, sessionId)
    }

    /**
     * Update participant presence from server message
     */
    public async updateParticipantPresence(participant: Participant): Promise<void> {
        this.participants.set(participant.id, participant)
        this.outputChannel.appendLine(`Updated presence for participant ${participant.name}`)
    }

    /**
     * Get all participants
     */
    public getParticipants(): Participant[] {
        return Array.from(this.participants.values())
    }

    /**
     * Get a specific participant
     */
    public getParticipant(id: string): Participant | undefined {
        return this.participants.get(id)
    }

    /**
     * Remove a participant
     */
    public removeParticipant(id: string): void {
        this.participants.delete(id)
        this.outputChannel.appendLine(`Removed participant ${id}`)
    }

    /**
     * Get current participant ID
     */
    private getCurrentParticipantId(): string {
        // In a real implementation, this would come from authentication
        return "participant_" + vscode.env.machineId
    }

    /**
     * Get current participant name
     */
    private getCurrentParticipantName(): string {
        // In a real implementation, this would come from user profile
        return vscode.env.machineId || "Anonymous"
    }

    /**
     * Generate a unique color for a participant
     */
    private generateParticipantColor(): string {
        // Simple color generation based on participant ID
        const colors = [
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
            "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
            "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA"
        ]
        
        const idHash = this.getCurrentParticipantId().split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0)
            return a & a
        }, 0)
        
        return colors[Math.abs(idHash) % colors.length]
    }

    /**
     * Show participant cursors in the editor
     */
    public async showParticipantCursors(editor: vscode.TextEditor, participant: Participant): Promise<void> {
        // Create decoration for participant cursor
        const decorationType = vscode.window.createTextEditorDecorationType({
            cursor: "crosshair",
            backgroundColor: participant.color + "40", // Add transparency
            borderColor: participant.color,
            borderStyle: "solid",
            borderWidth: "1px",
            overviewRulerColor: participant.color,
            overviewRulerLane: vscode.OverviewRulerLane.Center
        })

        // Store decoration type for cleanup
        this.cursorDecorations.set(participant.id, decorationType)

        // Apply decoration if participant has cursor position
        if (participant.cursorPosition) {
            const range = new vscode.Range(
                participant.cursorPosition,
                participant.cursorPosition
            )
            
            editor.setDecorations(decorationType, [range])
        }

        this.outputChannel.appendLine(`Showing cursor for participant ${participant.name}`)
    }

    /**
     * Hide participant cursors
     */
    public async hideParticipantCursors(participantId: string): Promise<void> {
        const decorationType = this.cursorDecorations.get(participantId)
        if (decorationType) {
            decorationType.dispose()
            this.cursorDecorations.delete(participantId)
        }
        
        this.outputChannel.appendLine(`Hiding cursor for participant ${participantId}`)
    }

    /**
     * Update participant cursor position
     */
    public async updateParticipantCursor(
        editor: vscode.TextEditor, 
        participant: Participant
    ): Promise<void> {
        const decorationType = this.cursorDecorations.get(participant.id)
        if (decorationType && participant.cursorPosition) {
            const range = new vscode.Range(
                participant.cursorPosition,
                participant.cursorPosition
            )
            
            editor.setDecorations(decorationType, [range])
        }
    }

    /**
     * Get activity indicator for a participant
     */
    public getActivityIndicator(participantId: string): ActivityIndicator | undefined {
        return this.activityIndicators.get(participantId)
    }

    /**
     * Get all activity indicators
     */
    public getAllActivityIndicators(): ActivityIndicator[] {
        return Array.from(this.activityIndicators.values())
    }
}