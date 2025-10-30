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
import * as fs from "fs/promises"
import * as path from "path"
import { glob } from "glob"

export interface SecurityFinding {
    id: string
    type: "vulnerability" | "secret" | "misconfiguration"
    severity: "low" | "medium" | "high" | "critical"
    file: string
    line: number
    column: number
    message: string
    remediation?: string
    timestamp: Date
}

export interface SecurityScanResult {
    findings: SecurityFinding[]
    scannedFiles: number
    scanDuration: number
    timestamp: Date
}

export class SecurityService {
    private static instance: SecurityService

    // Common secret patterns (simplified for demonstration)
    private secretPatterns = [
        { name: "AWS Access Key", pattern: /AKIA[0-9A-Z]{16}/g },
        { name: "AWS Secret Key", pattern: /[0-9a-zA-Z/+]{40}/g },
        { name: "GitHub Token", pattern: /ghp_[a-zA-Z0-9]{36}/g },
        { name: "GitHub Token (old)", pattern: /[a-f0-9]{40}/g },
        { name: "Private Key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
        { name: "Password", pattern: /password\s*=\s*["'][^"']*["']/gi },
        { name: "API Key", pattern: /api[_-]?key\s*=\s*["'][^"']*["']/gi }
    ]

    // Common vulnerability patterns
    private vulnerabilityPatterns = [
        { name: "Hardcoded Credentials", pattern: /(username|password|token|key)\s*=\s*["'][^"']*["']/gi },
        { name: "Insecure URL", pattern: /http:\/\/[^\s"']+/g },
        { name: "Debug Mode", pattern: /(debug|dev)_mode\s*=\s*(true|1|on)/gi }
    ]

    private constructor() {}

    public static getInstance(): SecurityService {
        if (!SecurityService.instance) {
            SecurityService.instance = new SecurityService()
        }
        return SecurityService.instance
    }

    /**
     * Scan for vulnerabilities in the workspace
     */
    public async scanVulnerabilities(workspacePath: string): Promise<SecurityScanResult> {
        const startTime = Date.now()
        const findings: SecurityFinding[] = []
        let scannedFiles = 0

        try {
            // Get all files in the workspace
            const files = await this.getAllFiles(workspacePath)
            
            for (const file of files) {
                try {
                    const content = await fs.readFile(file, "utf8")
                    const relativePath = path.relative(workspacePath, file)
                    
                    // Check for vulnerabilities
                    for (const pattern of this.vulnerabilityPatterns) {
                        const matches = content.match(pattern.pattern)
                        if (matches) {
                            for (const match of matches) {
                                const lines = content.split("\n")
                                const lineIndex = lines.findIndex(line => line.includes(match))
                                const line = lineIndex >= 0 ? lineIndex + 1 : 1
                                
                                findings.push({
                                    id: this.generateFindingId(),
                                    type: "vulnerability",
                                    severity: this.getVulnerabilitySeverity(pattern.name),
                                    file: relativePath,
                                    line: line,
                                    column: 1,
                                    message: `Potential vulnerability found: ${pattern.name}`,
                                    remediation: this.getVulnerabilityRemediation(pattern.name),
                                    timestamp: new Date()
                                })
                            }
                        }
                    }
                    
                    scannedFiles++
                } catch (error) {
                    // Skip files that can't be read
                    continue
                }
            }
        } catch (error) {
            throw new Error(`Failed to scan for vulnerabilities: ${error.message}`)
        }

        const endTime = Date.now()
        
        return {
            findings,
            scannedFiles,
            scanDuration: endTime - startTime,
            timestamp: new Date()
        }
    }

    /**
     * Scan for secrets in the workspace
     */
    public async scanSecrets(workspacePath: string): Promise<SecurityScanResult> {
        const startTime = Date.now()
        const findings: SecurityFinding[] = []
        let scannedFiles = 0

        try {
            // Get all files in the workspace
            const files = await this.getAllFiles(workspacePath)
            
            for (const file of files) {
                try {
                    // Skip binary files and large files
                    if (await this.shouldSkipFile(file)) {
                        continue
                    }
                    
                    const content = await fs.readFile(file, "utf8")
                    const relativePath = path.relative(workspacePath, file)
                    
                    // Check for secrets
                    for (const pattern of this.secretPatterns) {
                        const matches = content.match(pattern.pattern)
                        if (matches) {
                            for (const match of matches) {
                                const lines = content.split("\n")
                                const lineIndex = lines.findIndex(line => line.includes(match.toString()))
                                const line = lineIndex >= 0 ? lineIndex + 1 : 1
                                
                                findings.push({
                                    id: this.generateFindingId(),
                                    type: "secret",
                                    severity: this.getSecretSeverity(pattern.name),
                                    file: relativePath,
                                    line: line,
                                    column: 1,
                                    message: `Potential secret found: ${pattern.name}`,
                                    remediation: this.getSecretRemediation(pattern.name),
                                    timestamp: new Date()
                                })
                            }
                        }
                    }
                    
                    scannedFiles++
                } catch (error) {
                    // Skip files that can't be read
                    continue
                }
            }
        } catch (error) {
            throw new Error(`Failed to scan for secrets: ${error.message}`)
        }

        const endTime = Date.now()
        
        return {
            findings,
            scannedFiles,
            scanDuration: endTime - startTime,
            timestamp: new Date()
        }
    }

    /**
     * Get all files in a directory recursively
     */
    private async getAllFiles(dir: string): Promise<string[]> {
        try {
            // Use glob to find all files
            const pattern = path.join(dir, "**/*")
            const files = await glob(pattern, { 
                ignore: [
                    "**/node_modules/**",
                    "**/.git/**",
                    "**/dist/**",
                    "**/build/**",
                    "**/.vscode/**",
                    "**/coverage/**",
                    "**/*.log"
                ],
                nodir: true
            })
            return files
        } catch (error) {
            // Fallback to simple directory reading
            const files: string[] = []
            const items = await fs.readdir(dir, { withFileTypes: true })
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name)
                if (item.isDirectory()) {
                    if (!item.name.startsWith(".") && 
                        item.name !== "node_modules" && 
                        item.name !== "dist" && 
                        item.name !== "build") {
                        files.push(...await this.getAllFiles(fullPath))
                    }
                } else {
                    files.push(fullPath)
                }
            }
            
            return files
        }
    }

    /**
     * Check if a file should be skipped during scanning
     */
    private async shouldSkipFile(filePath: string): Promise<boolean> {
        const stats = await fs.stat(filePath)
        
        // Skip large files (>1MB)
        if (stats.size > 1024 * 1024) {
            return true
        }
        
        // Skip binary files based on extension
        const binaryExtensions = [
            ".exe", ".dll", ".so", ".dylib", ".bin", ".img", ".iso",
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".ico",
            ".mp3", ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv",
            ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2",
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"
        ]
        
        const ext = path.extname(filePath).toLowerCase()
        return binaryExtensions.includes(ext)
    }

    /**
     * Generate a unique finding ID
     */
    private generateFindingId(): string {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15)
    }

    /**
     * Get severity for a vulnerability
     */
    private getVulnerabilitySeverity(vulnerabilityName: string): "low" | "medium" | "high" | "critical" {
        const highSeverity = [
            "Hardcoded Credentials"
        ]
        
        const mediumSeverity = [
            "Insecure URL",
            "Debug Mode"
        ]
        
        if (highSeverity.includes(vulnerabilityName)) {
            return "high"
        } else if (mediumSeverity.includes(vulnerabilityName)) {
            return "medium"
        } else {
            return "low"
        }
    }

    /**
     * Get severity for a secret
     */
    private getSecretSeverity(secretName: string): "low" | "medium" | "high" | "critical" {
        const criticalSeverity = [
            "Private Key"
        ]
        
        const highSeverity = [
            "AWS Access Key",
            "AWS Secret Key",
            "GitHub Token"
        ]
        
        const mediumSeverity = [
            "GitHub Token (old)"
        ]
        
        if (criticalSeverity.includes(secretName)) {
            return "critical"
        } else if (highSeverity.includes(secretName)) {
            return "high"
        } else if (mediumSeverity.includes(secretName)) {
            return "medium"
        } else {
            return "low"
        }
    }

    /**
     * Get remediation advice for a vulnerability
     */
    private getVulnerabilityRemediation(vulnerabilityName: string): string {
        const remediations: Record<string, string> = {
            "Hardcoded Credentials": "Remove hardcoded credentials and use environment variables or secure configuration management",
            "Insecure URL": "Use HTTPS instead of HTTP for secure communication",
            "Debug Mode": "Disable debug mode in production environments"
        }
        
        return remediations[vulnerabilityName] || "Review the code and follow security best practices"
    }

    /**
     * Get remediation advice for a secret
     */
    private getSecretRemediation(secretName: string): string {
        const remediations: Record<string, string> = {
            "Private Key": "Immediately revoke and regenerate the private key, then store it securely",
            "AWS Access Key": "Revoke the AWS access key and generate a new one with minimal required permissions",
            "AWS Secret Key": "Revoke the AWS secret key and generate a new one",
            "GitHub Token": "Revoke the GitHub token and generate a new one with appropriate scopes",
            "GitHub Token (old)": "Revoke the GitHub token and generate a new one with appropriate scopes",
            "Password": "Remove the hardcoded password and use secure credential storage",
            "API Key": "Remove the hardcoded API key and use secure credential storage"
        }
        
        return remediations[secretName] || "Remove the secret and store it securely using environment variables or a secrets manager"
    }
}