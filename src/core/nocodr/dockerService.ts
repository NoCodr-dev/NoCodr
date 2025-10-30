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
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export interface DockerContainer {
    id: string
    name: string
    image: string
    status: string
    ports: string
    createdAt: string
}

export interface DockerImage {
    id: string
    repository: string
    tag: string
    size: string
    createdAt: string
}

export interface DockerNetwork {
    id: string
    name: string
    driver: string
    scope: string
}

export class DockerService {
    private static instance: DockerService

    private constructor() {}

    public static getInstance(): DockerService {
        if (!DockerService.instance) {
            DockerService.instance = new DockerService()
        }
        return DockerService.instance
    }

    /**
     * Check if Docker is available on the system
     */
    public async isDockerAvailable(): Promise<boolean> {
        try {
            await execAsync("docker --version")
            return true
        } catch (error) {
            return false
        }
    }

    /**
     * List all Docker containers
     */
    public async listContainers(): Promise<DockerContainer[]> {
        try {
            const { stdout } = await execAsync(
                "docker ps -a --format 'table {{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}|{{.CreatedAt}}' | tail -n +2"
            )
            
            const containers: DockerContainer[] = []
            const lines = stdout.trim().split("\n")
            
            for (const line of lines) {
                if (line.trim()) {
                    const [id, name, image, status, ports, createdAt] = line.split("|")
                    containers.push({
                        id: id.trim(),
                        name: name.trim(),
                        image: image.trim(),
                        status: status.trim(),
                        ports: ports.trim(),
                        createdAt: createdAt.trim()
                    })
                }
            }
            
            return containers
        } catch (error) {
            throw new Error(`Failed to list containers: ${error.message}`)
        }
    }

    /**
     * List all Docker images
     */
    public async listImages(): Promise<DockerImage[]> {
        try {
            const { stdout } = await execAsync(
                "docker images --format 'table {{.ID}}|{{.Repository}}|{{.Tag}}|{{.Size}}|{{.CreatedAt}}' | tail -n +2"
            )
            
            const images: DockerImage[] = []
            const lines = stdout.trim().split("\n")
            
            for (const line of lines) {
                if (line.trim()) {
                    const [id, repository, tag, size, createdAt] = line.split("|")
                    images.push({
                        id: id.trim(),
                        repository: repository.trim(),
                        tag: tag.trim(),
                        size: size.trim(),
                        createdAt: createdAt.trim()
                    })
                }
            }
            
            return images
        } catch (error) {
            throw new Error(`Failed to list images: ${error.message}`)
        }
    }

    /**
     * List all Docker networks
     */
    public async listNetworks(): Promise<DockerNetwork[]> {
        try {
            const { stdout } = await execAsync(
                "docker network ls --format 'table {{.ID}}|{{.Name}}|{{.Driver}}|{{.Scope}}' | tail -n +2"
            )
            
            const networks: DockerNetwork[] = []
            const lines = stdout.trim().split("\n")
            
            for (const line of lines) {
                if (line.trim()) {
                    const [id, name, driver, scope] = line.split("|")
                    networks.push({
                        id: id.trim(),
                        name: name.trim(),
                        driver: driver.trim(),
                        scope: scope.trim()
                    })
                }
            }
            
            return networks
        } catch (error) {
            throw new Error(`Failed to list networks: ${error.message}`)
        }
    }

    /**
     * Start a Docker container
     */
    public async startContainer(containerId: string): Promise<void> {
        try {
            await execAsync(`docker start ${containerId}`)
        } catch (error) {
            throw new Error(`Failed to start container ${containerId}: ${error.message}`)
        }
    }

    /**
     * Stop a Docker container
     */
    public async stopContainer(containerId: string): Promise<void> {
        try {
            await execAsync(`docker stop ${containerId}`)
        } catch (error) {
            throw new Error(`Failed to stop container ${containerId}: ${error.message}`)
        }
    }

    /**
     * Remove a Docker container
     */
    public async removeContainer(containerId: string): Promise<void> {
        try {
            await execAsync(`docker rm ${containerId}`)
        } catch (error) {
            throw new Error(`Failed to remove container ${containerId}: ${error.message}`)
        }
    }

    /**
     * Remove a Docker image
     */
    public async removeImage(imageId: string): Promise<void> {
        try {
            await execAsync(`docker rmi ${imageId}`)
        } catch (error) {
            throw new Error(`Failed to remove image ${imageId}: ${error.message}`)
        }
    }
}