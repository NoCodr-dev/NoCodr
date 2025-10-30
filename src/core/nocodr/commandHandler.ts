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
import { DockerService } from "./dockerService"
import { DatabaseService } from "./databaseService"
import { ApiService } from "./apiService"
import { SecurityService } from "./securityService"

export class NoCodrCommandHandler {
    private dockerService: DockerService
    private databaseService: DatabaseService
    private apiService: ApiService
    private securityService: SecurityService

    constructor() {
        this.dockerService = DockerService.getInstance()
        this.databaseService = DatabaseService.getInstance()
        this.apiService = ApiService.getInstance()
        this.securityService = SecurityService.getInstance()
    }

    /**
     * Handle Docker container listing command
     */
    public async handleListDockerContainers(): Promise<void> {
        try {
            const isAvailable = await this.dockerService.isDockerAvailable()
            if (!isAvailable) {
                vscode.window.showErrorMessage("Docker is not available on this system. Please install Docker and try again.")
                return
            }

            const containers = await this.dockerService.listContainers()
            
            if (containers.length === 0) {
                vscode.window.showInformationMessage("No Docker containers found.")
                return
            }

            // Create a formatted output
            let output = "# Docker Containers\n\n"
            output += "| ID | Name | Image | Status | Ports | Created |\n"
            output += "|----|------|-------|--------|-------|---------|\n"
            
            for (const container of containers) {
                output += `| ${container.id.substring(0, 12)} | ${container.name} | ${container.image} | ${container.status} | ${container.ports || 'None'} | ${container.createdAt} |\n`
            }

            // Show output in a new document
            await this.showOutputInDocument("Docker Containers", output)
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to list Docker containers: ${error.message}`)
        }
    }

    /**
     * Handle Docker image listing command
     */
    public async handleListDockerImages(): Promise<void> {
        try {
            const isAvailable = await this.dockerService.isDockerAvailable()
            if (!isAvailable) {
                vscode.window.showErrorMessage("Docker is not available on this system. Please install Docker and try again.")
                return
            }

            const images = await this.dockerService.listImages()
            
            if (images.length === 0) {
                vscode.window.showInformationMessage("No Docker images found.")
                return
            }

            // Create a formatted output
            let output = "# Docker Images\n\n"
            output += "| ID | Repository | Tag | Size | Created |\n"
            output += "|----|------------|-----|------|---------|\n"
            
            for (const image of images) {
                output += `| ${image.id.substring(0, 12)} | ${image.repository} | ${image.tag} | ${image.size} | ${image.createdAt} |\n`
            }

            // Show output in a new document
            await this.showOutputInDocument("Docker Images", output)
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to list Docker images: ${error.message}`)
        }
    }

    /**
     * Handle Docker network listing command
     */
    public async handleListDockerNetworks(): Promise<void> {
        try {
            const isAvailable = await this.dockerService.isDockerAvailable()
            if (!isAvailable) {
                vscode.window.showErrorMessage("Docker is not available on this system. Please install Docker and try again.")
                return
            }

            const networks = await this.dockerService.listNetworks()
            
            if (networks.length === 0) {
                vscode.window.showInformationMessage("No Docker networks found.")
                return
            }

            // Create a formatted output
            let output = "# Docker Networks\n\n"
            output += "| ID | Name | Driver | Scope |\n"
            output += "|----|------|--------|-------|\n"
            
            for (const network of networks) {
                output += `| ${network.id.substring(0, 12)} | ${network.name} | ${network.driver} | ${network.scope} |\n`
            }

            // Show output in a new document
            await this.showOutputInDocument("Docker Networks", output)
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to list Docker networks: ${error.message}`)
        }
    }

    /**
     * Handle database connection listing command
     */
    public async handleListDatabaseConnections(): Promise<void> {
        try {
            const connections = await this.databaseService.listConnections()
            
            if (connections.length === 0) {
                vscode.window.showInformationMessage("No database connections configured. Use the NoCoder settings to add database connections.")
                return
            }

            // Create a formatted output
            let output = "# Database Connections\n\n"
            output += "| ID | Name | Type | Host | Database |\n"
            output += "|----|------|------|------|----------|\n"
            
            for (const connection of connections) {
                output += `| ${connection.id} | ${connection.name} | ${connection.type} | ${connection.host || 'N/A'} | ${connection.database || 'N/A'} |\n`
            }

            // Show output in a new document
            await this.showOutputInDocument("Database Connections", output)
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to list database connections: ${error.message}`)
        }
    }

    /**
     * Handle database query execution command
     */
    public async handleExecuteDatabaseQuery(): Promise<void> {
        try {
            // Show input box for connection selection
            const connections = await this.databaseService.listConnections()
            if (connections.length === 0) {
                vscode.window.showErrorMessage("No database connections configured. Please add database connections in NoCoder settings first.")
                return
            }

            const connectionNames = connections.map(conn => conn.name)
            const selectedConnectionName = await vscode.window.showQuickPick(connectionNames, {
                placeHolder: "Select a database connection"
            })

            if (!selectedConnectionName) {
                return
            }

            const selectedConnection = connections.find(conn => conn.name === selectedConnectionName)
            if (!selectedConnection) {
                vscode.window.showErrorMessage("Selected connection not found.")
                return
            }

            // Show input box for SQL query
            const query = await vscode.window.showInputBox({
                prompt: "Enter your SQL query",
                placeHolder: "SELECT * FROM table_name LIMIT 10;",
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return "Query cannot be empty"
                    }
                    return null
                }
            })

            if (!query) {
                return
            }

            // Execute the query
            const result = await this.databaseService.executeQuery(selectedConnection.id, query)
            
            // Format and display results
            let output = `# Query Results\n\n`
            output += `**Connection:** ${selectedConnection.name}\n`
            output += `**Query:** ${query}\n`
            output += `**Rows returned:** ${result.rowCount}\n\n`
            
            if (result.rows.length > 0) {
                // Create table header
                if (result.fields && result.fields.length > 0) {
                    output += "| " + result.fields.join(" | ") + " |\n"
                    output += "|" + result.fields.map(() => "----").join("|") + "|\n"
                }
                
                // Add rows
                for (const row of result.rows) {
                    if (Array.isArray(row)) {
                        output += "| " + row.map(cell => String(cell)).join(" | ") + " |\n"
                    } else {
                        const values = Object.values(row)
                        output += "| " + values.map(cell => String(cell)).join(" | ") + " |\n"
                    }
                }
            } else {
                output += "No results returned.\n"
            }

            // Show output in a new document
            await this.showOutputInDocument("Query Results", output)
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to execute database query: ${error.message}`)
        }
    }

    /**
     * Handle API endpoint listing command
     */
    public async handleListApiEndpoints(): Promise<void> {
        try {
            const endpoints = await this.apiService.listEndpoints()
            
            if (endpoints.length === 0) {
                vscode.window.showInformationMessage("No API endpoints configured. Use the NoCoder settings to add API endpoints.")
                return
            }

            // Create a formatted output
            let output = "# API Endpoints\n\n"
            output += "| ID | Name | Method | URL | Last Status |\n"
            output += "|----|------|--------|-----|-------------|\n"
            
            for (const endpoint of endpoints) {
                const lastStatus = endpoint.lastStatus ? endpoint.lastStatus : "Never tested"
                output += `| ${endpoint.id} | ${endpoint.name} | ${endpoint.method} | ${endpoint.url} | ${lastStatus} |\n`
            }

            // Show output in a new document
            await this.showOutputInDocument("API Endpoints", output)
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to list API endpoints: ${error.message}`)
        }
    }

    /**
     * Handle API endpoint testing command
     */
    public async handleTestApiEndpoint(): Promise<void> {
        try {
            // Show input box for URL
            const url = await vscode.window.showInputBox({
                prompt: "Enter the API endpoint URL",
                placeHolder: "https://api.example.com/users",
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return "URL cannot be empty"
                    }
                    try {
                        new URL(value)
                        return null
                    } catch {
                        return "Please enter a valid URL"
                    }
                }
            })

            if (!url) {
                return
            }

            // Show quick pick for HTTP method
            const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"]
            const method = await vscode.window.showQuickPick(methods, {
                placeHolder: "Select HTTP method"
            })

            if (!method) {
                return
            }

            // Test the endpoint
            const result = await this.apiService.testEndpointCustom(url, method)
            
            // Format and display results
            let output = `# API Test Results\n\n`
            output += `**URL:** ${url}\n`
            output += `**Method:** ${method}\n`
            output += `**Status:** ${result.status} ${result.statusText}\n`
            output += `**Response Time:** ${result.responseTime}ms\n`
            output += `**Timestamp:** ${result.timestamp.toISOString()}\n\n`
            
            output += `## Response Headers
\`\`\`json
${JSON.stringify(result.headers, null, 2)}
\`\`\`

`
            
            output += `## Response Body
\`\`\`json
${result.body}
\`\`\`
`

            // Show output in a new document
            await this.showOutputInDocument("API Test Results", output)
            
            // Show status message
            if (result.status >= 200 && result.status < 300) {
                vscode.window.showInformationMessage(`API test successful: ${result.status} ${result.statusText}`)
            } else {
                vscode.window.showErrorMessage(`API test failed: ${result.status} ${result.statusText}`)
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to test API endpoint: ${error.message}`)
        }
    }

    /**
     * Handle vulnerability scanning command
     */
    public async handleScanVulnerabilities(): Promise<void> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage("No workspace folder is open. Please open a workspace folder to scan.")
                return
            }

            const workspacePath = workspaceFolders[0].uri.fsPath
            
            vscode.window.showInformationMessage("Scanning for vulnerabilities... This may take a moment.")
            
            const result = await this.securityService.scanVulnerabilities(workspacePath)
            
            if (result.findings.length === 0) {
                vscode.window.showInformationMessage(`Scan complete. No vulnerabilities found in ${result.scannedFiles} files (${result.scanDuration}ms).`)
                return
            }

            // Create a formatted output
            let output = `# Vulnerability Scan Results\n\n`
            output += `**Scanned Files:** ${result.scannedFiles}\n`
            output += `**Scan Duration:** ${result.scanDuration}ms\n`
            output += `**Timestamp:** ${result.timestamp.toISOString()}\n\n`
            
            output += `## Findings (${result.findings.length})\n\n`
            
            // Group findings by severity
            const severityOrder = ["critical", "high", "medium", "low"]
            const findingsBySeverity: Record<string, any[]> = {
                "critical": [],
                "high": [],
                "medium": [],
                "low": []
            }
            
            for (const finding of result.findings) {
                findingsBySeverity[finding.severity].push(finding)
            }
            
            for (const severity of severityOrder) {
                const findings = findingsBySeverity[severity]
                if (findings.length > 0) {
                    output += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity (${findings.length})\n\n`
                    for (const finding of findings) {
                        output += `- **${finding.message}**\n`
                        output += `  - File: ${finding.file}:${finding.line}\n`
                        if (finding.remediation) {
                            output += `  - Remediation: ${finding.remediation}\n`
                        }
                        output += `\n`
                    }
                }
            }

            // Show output in a new document
            await this.showOutputInDocument("Vulnerability Scan Results", output)
            
            // Show summary message
            const criticalCount = findingsBySeverity["critical"].length
            const highCount = findingsBySeverity["high"].length
            vscode.window.showWarningMessage(`Vulnerability scan complete. Found ${criticalCount} critical and ${highCount} high severity issues.`)
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to scan for vulnerabilities: ${error.message}`)
        }
    }

    /**
     * Handle secret scanning command
     */
    public async handleScanSecrets(): Promise<void> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage("No workspace folder is open. Please open a workspace folder to scan.")
                return
            }

            const workspacePath = workspaceFolders[0].uri.fsPath
            
            vscode.window.showInformationMessage("Scanning for secrets... This may take a moment.")
            
            const result = await this.securityService.scanSecrets(workspacePath)
            
            if (result.findings.length === 0) {
                vscode.window.showInformationMessage(`Secret scan complete. No secrets found in ${result.scannedFiles} files (${result.scanDuration}ms).`)
                return
            }

            // Create a formatted output
            let output = `# Secret Scan Results\n\n`
            output += `**Scanned Files:** ${result.scannedFiles}\n`
            output += `**Scan Duration:** ${result.scanDuration}ms\n`
            output += `**Timestamp:** ${result.timestamp.toISOString()}\n\n`
            
            output += `## Findings (${result.findings.length})\n\n`
            
            // Group findings by severity
            const severityOrder = ["critical", "high", "medium", "low"]
            const findingsBySeverity: Record<string, any[]> = {
                "critical": [],
                "high": [],
                "medium": [],
                "low": []
            }
            
            for (const finding of result.findings) {
                findingsBySeverity[finding.severity].push(finding)
            }
            
            for (const severity of severityOrder) {
                const findings = findingsBySeverity[severity]
                if (findings.length > 0) {
                    output += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity (${findings.length})\n\n`
                    for (const finding of findings) {
                        output += `- **${finding.message}**\n`
                        output += `  - File: ${finding.file}:${finding.line}\n`
                        if (finding.remediation) {
                            output += `  - Remediation: ${finding.remediation}\n`
                        }
                        output += `\n`
                    }
                }
            }

            // Show output in a new document
            await this.showOutputInDocument("Secret Scan Results", output)
            
            // Show summary message
            const criticalCount = findingsBySeverity["critical"].length
            const highCount = findingsBySeverity["high"].length
            vscode.window.showWarningMessage(`Secret scan complete. Found ${criticalCount} critical and ${highCount} high severity secrets.`)
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to scan for secrets: ${error.message}`)
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
        
        const editor = await vscode.window.showTextDocument(document, {
            preview: false
        })
        
        // Set the document title
        await editor.edit(editBuilder => {
            editBuilder.setEndOfLine(vscode.EndOfLine.LF)
        })
    }
}