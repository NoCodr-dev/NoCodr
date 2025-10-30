import * as vscode from "vscode"
import * as http from "http"
import WebSocket, { WebSocketServer, RawData } from "ws"
import { CollaborationSession, Participant, TextChange } from "./LiveCollaborationService"

export interface ServerMessage {
    type: "session_created" | "session_joined" | "session_left" | "document_shared" | "document_unshared" | "text_change" | "presence_update" | "error"
    sessionId?: string
    participantId?: string
    data?: any
    error?: string
}

export class CollaborationServer {
    private wss: WebSocketServer | null = null
    private server: http.Server | null = null
    private sessions: Map<string, CollaborationSession> = new Map()
    private participants: Map<string, WebSocket> = new Map()
    private participantSessions: Map<string, string> = new Map() // participantId -> sessionId
    private outputChannel: vscode.OutputChannel

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel("NoCodr Collaboration Server")
    }

    /**
     * Start the collaboration server
     */
    public async start(host: string, port: number): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.server = http.createServer()
                this.wss = new WebSocketServer({ server: this.server })

                this.wss.on("connection", (ws: WebSocket) => {
                    this.handleConnection(ws)
                })

                this.server.listen(port, host, () => {
                    this.outputChannel.appendLine(`Collaboration server started on ${host}:${port}`)
                    resolve()
                })

                this.server.on("error", (error) => {
                    this.outputChannel.appendLine(`Server error: ${error.message}`)
                    reject(error)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Connect to an existing collaboration server
     */
    public async connect(host: string, port: number): Promise<void> {
        // In a real implementation, this would connect to a remote server
        // For now, we'll just simulate the connection
        this.outputChannel.appendLine(`Connected to collaboration server at ${host}:${port}`)
        return Promise.resolve()
    }

    /**
     * Create a new session
     */
    public async createSession(sessionId: string, host: string, port: number): Promise<CollaborationSession> {
        const session: CollaborationSession = {
            sessionId,
            host,
            port,
            participants: [],
            documents: [],
            createdAt: new Date()
        }
        
        this.sessions.set(sessionId, session)
        this.outputChannel.appendLine(`Created session ${sessionId}`)
        return session
    }

    /**
     * Join an existing session
     */
    public async joinSession(sessionId: string, participant: Participant): Promise<CollaborationSession> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session ${sessionId} not found`)
        }
        
        // Add participant to session if not already present
        const existingParticipant = session.participants.find(p => p.id === participant.id)
        if (!existingParticipant) {
            session.participants.push(participant)
        }
        
        // Track participant session
        this.participantSessions.set(participant.id, sessionId)
        
        this.outputChannel.appendLine(`Participant ${participant.id} joined session ${sessionId}`)
        return session
    }

    /**
     * Leave a session
     */
    public async leaveSession(sessionId: string): Promise<void> {
        this.sessions.delete(sessionId)
        this.outputChannel.appendLine(`Left session ${sessionId}`)
        return Promise.resolve()
    }

    /**
     * Send a text change to all participants
     */
    public async sendTextChange(change: TextChange, sessionId: string): Promise<void> {
        const message: ServerMessage = {
            type: "text_change",
            sessionId,
            data: change
        }
        
        this.broadcastMessage(message, sessionId)
        this.outputChannel.appendLine(`Sent text change for document ${change.documentUri.toString()}`)
    }

    /**
     * Send a presence update to all participants
     */
    public async sendPresenceUpdate(participant: Participant, sessionId: string): Promise<void> {
        const message: ServerMessage = {
            type: "presence_update",
            sessionId,
            data: participant
        }
        
        this.broadcastMessage(message, sessionId)
        this.outputChannel.appendLine(`Sent presence update for participant ${participant.id}`)
    }

    /**
     * Broadcast a message to all participants in a session
     */
    private broadcastMessage(message: ServerMessage, sessionId: string): void {
        const session = this.sessions.get(sessionId)
        if (!session) {
            this.outputChannel.appendLine(`Cannot broadcast: Session ${sessionId} not found`)
            return
        }
        
        // In a real implementation, this would send to all connected clients
        // For now, we'll just log the message
        this.outputChannel.appendLine(`Broadcasting message: ${message.type} to session ${sessionId}`)
        
        // In a real implementation, we would iterate through connected participants
        // and send the message to each one
        /*
        for (const participant of session.participants) {
            const socket = this.participants.get(participant.id)
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(message))
            }
        }
        */
    }

    /**
     * Handle WebSocket connections
     */
    private handleConnection(ws: WebSocket): void {
        this.outputChannel.appendLine("New WebSocket connection established")

        ws.on("message", (data: RawData) => {
            try {
                const message: ServerMessage = JSON.parse(data.toString())
                this.handleMessage(message, ws)
            } catch (error) {
                this.outputChannel.appendLine(`Error parsing message: ${error.message}`)
            }
        })

        ws.on("close", () => {
            this.handleDisconnection(ws)
        })

        ws.on("error", (error: Error) => {
            this.outputChannel.appendLine(`WebSocket error: ${error.message}`)
        })
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(message: ServerMessage, ws: WebSocket): void {
        this.outputChannel.appendLine(`Received message: ${message.type}`)

        switch (message.type) {
            case "session_created":
                this.handleSessionCreated(message, ws)
                break
            case "session_joined":
                this.handleSessionJoined(message, ws)
                break
            case "text_change":
                this.handleTextChange(message)
                break
            case "presence_update":
                this.handlePresenceUpdate(message)
                break
            default:
                this.outputChannel.appendLine(`Unknown message type: ${message.type}`)
        }
    }
    
    /**
     * Handle session creation message
     */
    private handleSessionCreated(message: ServerMessage, ws: WebSocket): void {
        if (message.sessionId) {
            this.outputChannel.appendLine(`Session created: ${message.sessionId}`)
            // In a real implementation, we would create the session and associate it with the WebSocket
        }
    }
    
    /**
     * Handle session join message
     */
    private handleSessionJoined(message: ServerMessage, ws: WebSocket): void {
        if (message.sessionId && message.participantId) {
            this.outputChannel.appendLine(`Participant ${message.participantId} joined session ${message.sessionId}`)
            // In a real implementation, we would add the participant to the session
            // and associate the WebSocket with the participant
            this.participants.set(message.participantId, ws)
        }
    }
    
    /**
     * Handle text change message
     */
    private handleTextChange(message: ServerMessage): void {
        if (message.sessionId && message.data) {
            this.outputChannel.appendLine(`Text change in session ${message.sessionId}`)
            // Broadcast the text change to all other participants in the session
            this.broadcastMessage(message, message.sessionId)
        }
    }
    
    /**
     * Handle presence update message
     */
    private handlePresenceUpdate(message: ServerMessage): void {
        if (message.sessionId && message.data) {
            this.outputChannel.appendLine(`Presence update in session ${message.sessionId}`)
            // Broadcast the presence update to all other participants in the session
            this.broadcastMessage(message, message.sessionId)
        }
    }

    /**
     * Handle WebSocket disconnections
     */
    private handleDisconnection(ws: WebSocket): void {
        this.outputChannel.appendLine("WebSocket connection closed")
        
        // Remove participant
        for (const [participantId, socket] of this.participants.entries()) {
            if (socket === ws) {
                this.participants.delete(participantId)
                break
            }
        }
    }

    /**
     * Stop the server
     */
    public async stop(): Promise<void> {
        if (this.wss) {
            this.wss.close()
        }
        if (this.server) {
            this.server.close()
        }
        this.outputChannel.appendLine("Collaboration server stopped")
    }
}