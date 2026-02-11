import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
    data?: T
    error?: string
    status?: number
    meta?: any
}

export function successResponse<T>(data: T, status = 200, meta?: any) {
    return NextResponse.json({
        success: true,
        data,
        meta
    }, { status })
}

export function errorResponse(message: string, status = 500, details?: any) {
    return NextResponse.json({
        success: false,
        error: message,
        details
    }, { status })
}
