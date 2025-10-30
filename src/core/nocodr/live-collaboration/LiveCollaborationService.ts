import * as vscode from "vscode"
import { CollaborationServer } from "./CollaborationServer"
import { DocumentSyncManager } from "./DocumentSyncManager"
import { PresenceManager } from "./PresenceManager"
import { ConflictResolver } from "./ConflictResolver"

export interface CollaborationSession {
    sessionId: string
    host: string
    port: number
    participants: Participant[]
    documents: SharedDocument[]
    createdAt: Date
}

export interface Participant {
    id: string
    name: string
    color: string
    cursorPosition?: vscode.Position
    selection?: vscode.Selection
    isActive: boolean
}

export interface SharedDocument {
    uri: vscode.Uri
    version: number
    content: string
    lastModified: Date
}

export interface TextChange {
    id: string
    participantId: string
    documentUri: vscode.Uri
    timestamp: Date
    operation: Operation
}

export interface Operation {
    type: "insert" | "delete" | "replace"
    position: vscode.Position
    text?: string
    length?: number
}

export class LiveCollaborationService {
    private static instance: LiveCollaborationService
    private server: CollaborationServer
    private documentSyncManager: DocumentSyncManager
    private presenceManager: PresenceManager
    private conflictResolver: ConflictResolver
    private activeSession: CollaborationSession | null = null
    private outputChannel: vscode.OutputChannel

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel("NoCodr Live Collaboration")
        this.server = new CollaborationServer()
        this.documentSyncManager = new DocumentSyncManager()
        this.presenceManager = new PresenceManager()
        this.conflictResolver = new ConflictResolver()
    }

    public static getInstance(): LiveCollaborationService {
        if (!LiveCollaborationService.instance) {
            LiveCollaborationService.instance = new LiveCollaborationService()
        }
        return LiveCollaborationService.instance
    }

    /**
     * Start a new collaboration session
     */
    public async startSession(options: { host?: string; port?: number }): Promise<CollaborationSession> {
        const host = options.host || "localhost"
        const port = options.port || 3001

        try {
            // Start the collaboration server
            await this.server.start(host, port)
            
            // Create new session
            this.activeSession = {
                sessionId: this.generateSessionId(),
                host,
                port,
                participants: [],
                documents: [],
                createdAt: new Date()
            }

            this.outputChannel.appendLine(`Collaboration session started on ${host}:${port}`)
            
            // Register event listeners
            this.setupEventListeners()
            
            return this.activeSession as CollaborationSession
        } catch (error) {
            this.outputChannel.appendLine(`Failed to start collaboration session: ${error.message}`)
            throw error
        }
    }

    /**
     * Join an existing collaboration session
     */
    public async joinSession(sessionId: string, host: string, port: number): Promise<CollaborationSession> {
        try {
            // Connect to the collaboration server
            await this.server.connect(host, port)
            
            // Create participant info
            const participant: Participant = {
                id: this.getCurrentParticipantId(),
                name: this.getCurrentParticipantName(),
                color: this.generateParticipantColor(),
                isActive: true
            }
            
            // Join the session
            this.activeSession = await this.server.joinSession(sessionId, participant)
            
            this.outputChannel.appendLine(`Joined collaboration session ${sessionId} on ${host}:${port}`)
            
            // Register event listeners
            this.setupEventListeners()
            
            return this.activeSession as CollaborationSession
        } catch (error) {
            this.outputChannel.appendLine(`Failed to join collaboration session: ${error.message}`)
            throw error
        }
    }
    
    /**
     * Get current participant ID
     */
    private getCurrentParticipantId(): string {
        return "participant_" + vscode.env.machineId
    }
    
    /**
     * Get current participant name
     */
    private getCurrentParticipantName(): string {
        return vscode.env.machineId || "Anonymous"
    }
    
    /**
     * Generate participant color
     */
    private generateParticipantColor(): string {
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
     * Leave the current collaboration session
     */
    public async leaveSession(): Promise<void> {
        if (this.activeSession) {
            try {
                await this.server.leaveSession(this.activeSession.sessionId)
                this.activeSession = null
                this.outputChannel.appendLine("Left collaboration session")
            } catch (error) {
                this.outputChannel.appendLine(`Failed to leave collaboration session: ${error.message}`)
                throw error
            }
        }
    }

    /**
     * Share a document for collaboration
     */
    public async shareDocument(uri: vscode.Uri): Promise<void> {
        if (!this.activeSession) {
            throw new Error("No active collaboration session")
        }

        try {
            const document = await vscode.workspace.openTextDocument(uri)
            const sharedDocument: SharedDocument = {
                uri,
                version: document.version,
                content: document.getText(),
                lastModified: new Date()
            }

            // Add to session
            this.activeSession.documents.push(sharedDocument)
            
            // Start syncing the document
            await this.documentSyncManager.startSync(uri, this.server)
            
            this.outputChannel.appendLine(`Document ${uri.toString()} shared for collaboration`)
        } catch (error) {
            this.outputChannel.appendLine(`Failed to share document: ${error.message}`)
            throw error
        }
    }

    /**
     * Stop sharing a document
     */
    public async unshareDocument(uri: vscode.Uri): Promise<void> {
        if (!this.activeSession) {
            throw new Error("No active collaboration session")
        }

        try {
            // Stop syncing the document
            await this.documentSyncManager.stopSync(uri)
            
            // Remove from session
            this.activeSession.documents = this.activeSession.documents.filter(doc => doc.uri.toString() !== uri.toString())
            
            this.outputChannel.appendLine(`Document ${uri.toString()} removed from collaboration`)
        } catch (error) {
            this.outputChannel.appendLine(`Failed to unshare document: ${error.message}`)
            throw error
        }
    }

    /**
     * Get the current collaboration session
     */
    public getSession(): CollaborationSession | null {
        return this.activeSession
    }

    /**
     * Get participant information
     */
    public getParticipants(): Participant[] {
        return this.activeSession?.participants || []
    }

    /**
     * Get shared documents
     */
    public getSharedDocuments(): SharedDocument[] {
        return this.activeSession?.documents || []
    }

    private generateSessionId(): string {
        return "session_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    }

    private setupEventListeners(): void {
        if (!this.activeSession) return

        // Listen for document changes
        vscode.workspace.onDidChangeTextDocument(async (event) => {
            if (this.activeSession) {
                // Check if this document is being shared
                const isShared = this.activeSession.documents.some(doc => 
                    doc.uri.toString() === event.document.uri.toString()
                )
                
                if (isShared) {
                    // Send typing activity indicator
                    await this.presenceManager.sendActivityIndicator(
                        "typing",
                        this.server,
                        this.activeSession.sessionId,
                        event.document.uri
                    )
                    
                    // Send changes to other participants
                    await this.documentSyncManager.sendChanges(event, this.server)
                }
            }
        })

        // Listen for cursor position changes
        vscode.window.onDidChangeTextEditorSelection(async (event) => {
            if (this.activeSession && event.textEditor) {
                const uri = event.textEditor.document.uri
                const isShared = this.activeSession.documents.some(doc => 
                    doc.uri.toString() === uri.toString()
                )
                
                if (isShared) {
                    // Send presence update
                    await this.presenceManager.sendPresenceUpdate(
                        event.textEditor, 
                        this.server,
                        this.activeSession.sessionId
                    )
                }
            }
        })

        // Listen for when the editor becomes active/inactive
        vscode.window.onDidChangeActiveTextEditor(async (editor) => {
            if (this.activeSession && editor) {
                const uri = editor.document.uri
                const isShared = this.activeSession.documents.some(doc => 
                    doc.uri.toString() === uri.toString()
                )
                
                if (isShared) {
                    // Send focused activity indicator
                    await this.presenceManager.sendActivityIndicator(
                        "focused",
                        this.server,
                        this.activeSession.sessionId,
                        uri
                    )
                }
            }
        })
    }
}