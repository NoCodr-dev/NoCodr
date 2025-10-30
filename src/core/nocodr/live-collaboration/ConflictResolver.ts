import * as vscode from "vscode"
import { TextChange } from "./LiveCollaborationService"

export interface ConflictResolution {
    type: "accept" | "reject" | "merge"
    changes: TextChange[]
    resolvedContent: string
}

export class ConflictResolver {
    private outputChannel: vscode.OutputChannel

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel("NoCodr Conflict Resolution")
    }

    /**
     * Resolve conflicts between concurrent changes
     */
    public async resolveConflicts(
        localChanges: TextChange[],
        remoteChanges: TextChange[]
    ): Promise<ConflictResolution> {
        // Simple conflict resolution strategy:
        // 1. If changes are on different lines, accept both
        // 2. If changes overlap, prompt user to resolve
        // 3. If changes are identical, accept one

        const hasConflicts = this.detectConflicts(localChanges, remoteChanges)
        
        if (!hasConflicts) {
            // No conflicts, merge changes
            return {
                type: "merge",
                changes: [...localChanges, ...remoteChanges],
                resolvedContent: ""
            }
        }

        // For now, we'll accept remote changes (in a real implementation, we'd prompt the user)
        this.outputChannel.appendLine("Conflicts detected, accepting remote changes")
        
        return {
            type: "accept",
            changes: remoteChanges,
            resolvedContent: ""
        }
    }

    /**
     * Detect conflicts between changes
     */
    private detectConflicts(
        localChanges: TextChange[],
        remoteChanges: TextChange[]
    ): boolean {
        // Simple conflict detection based on overlapping ranges
        for (const localChange of localChanges) {
            for (const remoteChange of remoteChanges) {
                if (this.changesOverlap(localChange, remoteChange)) {
                    return true
                }
            }
        }
        return false
    }

    /**
     * Check if two changes overlap
     */
    private changesOverlap(change1: TextChange, change2: TextChange): boolean {
        // More sophisticated overlap detection
        // Check if changes are on the same document
        if (change1.documentUri.toString() !== change2.documentUri.toString()) {
            return false
        }
        
        // Check if changes affect the same range or overlapping ranges
        const op1 = change1.operation
        const op2 = change2.operation
        
        // For insert operations, check if they're at the same position
        if (op1.type === "insert" && op2.type === "insert") {
            return op1.position.isEqual(op2.position)
        }
        
        // For other operations, check range overlap
        const range1 = this.getOperationRange(op1)
        const range2 = this.getOperationRange(op2)
        
        return this.rangesOverlap(range1, range2)
    }
    
    /**
     * Get the range affected by an operation
     */
    private getOperationRange(operation: import("./LiveCollaborationService").Operation): vscode.Range {
        const startPos = operation.position
        
        switch (operation.type) {
            case "insert":
                // Insert operations affect a single position
                return new vscode.Range(startPos, startPos)
            case "delete":
                // Delete operations affect a range
                const endPos = this.calculateEndPosition(startPos, operation.length || 0)
                return new vscode.Range(startPos, endPos)
            case "replace":
                // Replace operations affect a range
                const replaceEndPos = this.calculateEndPosition(startPos, operation.length || 0)
                return new vscode.Range(startPos, replaceEndPos)
            default:
                return new vscode.Range(startPos, startPos)
        }
    }
    
    /**
     * Calculate end position based on start position and length
     */
    private calculateEndPosition(start: vscode.Position, length: number): vscode.Position {
        // This is a simplified implementation
        // In a real implementation, this would properly handle multi-line operations
        return new vscode.Position(
            start.line,
            start.character + length
        )
    }
    
    /**
     * Check if two ranges overlap
     */
    private rangesOverlap(range1: vscode.Range, range2: vscode.Range): boolean {
        return range1.intersection(range2) !== undefined
    }

    /**
     * Transform operations using Operational Transformation
     */
    public transformOperations(
        operation: TextChange,
        against: TextChange
    ): TextChange {
        // Basic Operational Transformation implementation
        const transformedOp = { ...operation }
        
        // If the against operation happened before this one, transform it
        if (against.timestamp < operation.timestamp) {
            transformedOp.operation = this.transformOperation(
                operation.operation,
                against.operation
            )
        }
        
        return transformedOp
    }
    
    /**
     * Transform a single operation against another operation
     */
    private transformOperation(
        operation: import("./LiveCollaborationService").Operation,
        against: import("./LiveCollaborationService").Operation
    ): import("./LiveCollaborationService").Operation {
        const transformedOp = { ...operation }
        
        // Get ranges
        const opRange = this.getOperationRange(operation)
        const againstRange = this.getOperationRange(against)
        
        // If operations don't overlap, no transformation needed
        if (!this.rangesOverlap(opRange, againstRange)) {
            return operation
        }
        
        // Transform based on operation types
        switch (against.type) {
            case "insert":
                return this.transformAgainstInsert(transformedOp, against)
            case "delete":
                return this.transformAgainstDelete(transformedOp, against)
            case "replace":
                // For replace, treat as delete then insert
                const afterDelete = this.transformAgainstDelete(transformedOp, against)
                return this.transformAgainstInsert(afterDelete, against)
            default:
                return operation
        }
    }
    
    /**
     * Transform operation against an insert operation
     */
    private transformAgainstInsert(
        operation: import("./LiveCollaborationService").Operation,
        insertOp: import("./LiveCollaborationService").Operation
    ): import("./LiveCollaborationService").Operation {
        if (insertOp.type !== "insert" || !insertOp.text) return operation
        
        const transformedOp = { ...operation }
        const insertPos = insertOp.position
        const insertLength = insertOp.text.length
        
        // Adjust position if insert happened before this operation
        if (this.positionBefore(insertPos, operation.position)) {
            switch (operation.type) {
                case "insert":
                case "delete":
                case "replace":
                    // Move the position forward by the inserted text length
                    transformedOp.position = new vscode.Position(
                        operation.position.line,
                        operation.position.character + insertLength
                    )
                    break
            }
        }
        
        return transformedOp
    }
    
    /**
     * Transform operation against a delete operation
     */
    private transformAgainstDelete(
        operation: import("./LiveCollaborationService").Operation,
        deleteOp: import("./LiveCollaborationService").Operation
    ): import("./LiveCollaborationService").Operation {
        if (deleteOp.type !== "delete" || !deleteOp.length) return operation
        
        const transformedOp = { ...operation }
        const deleteRange = this.getOperationRange(deleteOp)
        const opRange = this.getOperationRange(operation)
        
        // If operation is after the deleted range, adjust position
        if (this.positionAfter(operation.position, deleteRange.end)) {
            switch (operation.type) {
                case "insert":
                case "delete":
                case "replace":
                    // Move the position backward by the deleted text length
                    transformedOp.position = new vscode.Position(
                        operation.position.line,
                        Math.max(0, operation.position.character - deleteOp.length)
                    )
                    break
            }
        }
        
        // If operation overlaps with deleted range, it should be invalidated
        if (this.rangesOverlap(opRange, deleteRange)) {
            // In a real implementation, this operation would be discarded
            // For now, we'll just adjust it to the start of the deleted range
            transformedOp.position = deleteRange.start
        }
        
        return transformedOp
    }
    
    /**
     * Check if position1 is before position2
     */
    private positionBefore(pos1: vscode.Position, pos2: vscode.Position): boolean {
        if (pos1.line < pos2.line) return true
        if (pos1.line > pos2.line) return false
        return pos1.character < pos2.character
    }
    
    /**
     * Check if position1 is after position2
     */
    private positionAfter(pos1: vscode.Position, pos2: vscode.Position): boolean {
        if (pos1.line > pos2.line) return true
        if (pos1.line < pos2.line) return false
        return pos1.character > pos2.character
    }

    /**
     * Merge changes into document content
     */
    public mergeChangesIntoContent(
        content: string,
        changes: TextChange[]
    ): string {
        // Apply changes to content in order
        let result = content
        
        // Sort changes by timestamp
        const sortedChanges = [...changes].sort((a, b) => 
            a.timestamp.getTime() - b.timestamp.getTime()
        )
        
        // Apply each change
        for (const change of sortedChanges) {
            result = this.applyChangeToContent(result, change)
        }
        
        return result
    }

    /**
     * Apply a single change to content
     */
    private applyChangeToContent(content: string, change: TextChange): string {
        // Convert content to lines for easier manipulation
        const lines = content.split('\n')
        
        switch (change.operation.type) {
            case "insert":
                if (change.operation.text) {
                    return this.insertText(lines, change.operation.position, change.operation.text)
                }
                break
            case "delete":
                if (change.operation.length) {
                    return this.deleteText(lines, change.operation.position, change.operation.length)
                }
                break
            case "replace":
                if (change.operation.text && change.operation.length) {
                    let result = this.deleteText(lines, change.operation.position, change.operation.length)
                    result = this.insertText(result.split('\n'), change.operation.position, change.operation.text)
                    return result
                }
                break
        }
        
        return content
    }

    /**
     * Insert text at a position
     */
    private insertText(lines: string[], position: vscode.Position, text: string): string {
        const line = lines[position.line] || ""
        const before = line.substring(0, position.character)
        const after = line.substring(position.character)
        
        // Handle multi-line inserts
        const textLines = text.split('\n')
        if (textLines.length === 1) {
            lines[position.line] = before + text + after
        } else {
            // Multi-line insert
            lines[position.line] = before + textLines[0]
            for (let i = 1; i < textLines.length - 1; i++) {
                lines.splice(position.line + i, 0, textLines[i])
            }
            lines.splice(position.line + textLines.length - 1, 0, textLines[textLines.length - 1] + after)
        }
        
        return lines.join('\n')
    }

    /**
     * Delete text at a position
     */
    private deleteText(lines: string[], position: vscode.Position, length: number): string {
        const line = lines[position.line] || ""
        const before = line.substring(0, position.character)
        const after = line.substring(position.character + length)
        lines[position.line] = before + after
        return lines.join('\n')
    }

    /**
     * Show conflict resolution UI
     */
    public async showConflictResolutionUI(
        localChanges: TextChange[],
        remoteChanges: TextChange[]
    ): Promise<ConflictResolution | null> {
        // In a real implementation, this would show a UI for conflict resolution
        // For now, we'll just log and return a default resolution
        
        this.outputChannel.appendLine("Showing conflict resolution UI")
        
        const choice = await vscode.window.showWarningMessage(
            "Conflicting changes detected. How would you like to resolve them?",
            "Accept Remote Changes",
            "Keep Local Changes",
            "Merge Manually"
        )
        
        if (!choice) {
            return null
        }
        
        switch (choice) {
            case "Accept Remote Changes":
                return {
                    type: "accept",
                    changes: remoteChanges,
                    resolvedContent: ""
                }
            case "Keep Local Changes":
                return {
                    type: "reject",
                    changes: localChanges,
                    resolvedContent: ""
                }
            case "Merge Manually":
                // In a real implementation, this would open a merge editor
                return {
                    type: "merge",
                    changes: [...localChanges, ...remoteChanges],
                    resolvedContent: ""
                }
            default:
                return null
        }
    }
}