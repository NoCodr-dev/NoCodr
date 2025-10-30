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
import axios, { AxiosRequestConfig, AxiosResponse } from "axios"

export interface ApiEndpoint {
    id: string
    name: string
    url: string
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
    headers?: Record<string, string>
    body?: string
    lastTested?: Date
    lastStatus?: number
}

export interface ApiTestResult {
    endpointId: string
    status: number
    statusText: string
    headers: Record<string, string>
    body: string
    responseTime: number
    timestamp: Date
}

export class ApiService {
    private static instance: ApiService
    private endpoints: Map<string, ApiEndpoint> = new Map()

    private constructor() {}

    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService()
        }
        return ApiService.instance
    }

    /**
     * List all API endpoints
     */
    public async listEndpoints(): Promise<ApiEndpoint[]> {
        return Array.from(this.endpoints.values())
    }

    /**
     * Add a new API endpoint
     */
    public async addEndpoint(endpoint: ApiEndpoint): Promise<void> {
        this.endpoints.set(endpoint.id, endpoint)
    }

    /**
     * Remove an API endpoint
     */
    public async removeEndpoint(endpointId: string): Promise<void> {
        this.endpoints.delete(endpointId)
    }

    /**
     * Update an existing API endpoint
     */
    public async updateEndpoint(endpoint: ApiEndpoint): Promise<void> {
        this.endpoints.set(endpoint.id, endpoint)
    }

    /**
     * Test an API endpoint
     */
    public async testEndpoint(endpointId: string): Promise<ApiTestResult> {
        const endpoint = this.endpoints.get(endpointId)
        if (!endpoint) {
            throw new Error(`Endpoint ${endpointId} not found`)
        }

        const config: AxiosRequestConfig = {
            method: endpoint.method,
            url: endpoint.url,
            headers: endpoint.headers,
            data: endpoint.body ? JSON.parse(endpoint.body) : undefined,
            timeout: 30000 // 30 second timeout
        }

        const startTime = Date.now()
        
        try {
            const response: AxiosResponse = await axios(config)
            const endTime = Date.now()
            
            const testResult: ApiTestResult = {
                endpointId,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers as Record<string, string>,
                body: typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2),
                responseTime: endTime - startTime,
                timestamp: new Date()
            }

            // Update endpoint with test results
            endpoint.lastTested = new Date()
            endpoint.lastStatus = response.status
            this.endpoints.set(endpointId, endpoint)

            return testResult
        } catch (error: any) {
            const endTime = Date.now()
            
            const testResult: ApiTestResult = {
                endpointId,
                status: error.response?.status || 0,
                statusText: error.response?.statusText || error.message,
                headers: error.response?.headers || {},
                body: error.response?.data ? 
                    (typeof error.response.data === "string" ? error.response.data : JSON.stringify(error.response.data, null, 2)) : 
                    error.message,
                responseTime: endTime - startTime,
                timestamp: new Date()
            }

            // Update endpoint with test results
            endpoint.lastTested = new Date()
            endpoint.lastStatus = error.response?.status || 0
            this.endpoints.set(endpointId, endpoint)

            return testResult
        }
    }

    /**
     * Test an API endpoint with custom parameters
     */
    public async testEndpointCustom(url: string, method: string, headers?: Record<string, string>, body?: string): Promise<ApiTestResult> {
        const config: AxiosRequestConfig = {
            method: method as any,
            url: url,
            headers: headers,
            data: body ? JSON.parse(body) : undefined,
            timeout: 30000 // 30 second timeout
        }

        const startTime = Date.now()
        
        try {
            const response: AxiosResponse = await axios(config)
            const endTime = Date.now()
            
            return {
                endpointId: "custom",
                status: response.status,
                statusText: response.statusText,
                headers: response.headers as Record<string, string>,
                body: typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2),
                responseTime: endTime - startTime,
                timestamp: new Date()
            }
        } catch (error: any) {
            const endTime = Date.now()
            
            return {
                endpointId: "custom",
                status: error.response?.status || 0,
                statusText: error.response?.statusText || error.message,
                headers: error.response?.headers || {},
                body: error.response?.data ? 
                    (typeof error.response.data === "string" ? error.response.data : JSON.stringify(error.response.data, null, 2)) : 
                    error.message,
                responseTime: endTime - startTime,
                timestamp: new Date()
            }
        }
    }
}