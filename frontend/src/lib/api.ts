// API utilities for future implementation
export interface Lead {
    id: number
    name: string
    email: string
    address: string
    quote: string
    status: "pending" | "approved" | "rejected"
    date: string
  }
  
  export interface LeadsResponse {
    data: Lead[]
    total: number
    page: number
    totalPages: number
  }
  
  export interface LeadsParams {
    page?: number
    limit?: number
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
  }
  
  // Future API functions
  export async function fetchLeads(params: LeadsParams = {}): Promise<LeadsResponse> {
    const searchParams = new URLSearchParams()
  
    if (params.page) searchParams.set("page", params.page.toString())
    if (params.limit) searchParams.set("limit", params.limit.toString())
    if (params.search) searchParams.set("search", params.search)
    if (params.status) searchParams.set("status", params.status)
    if (params.sortBy) searchParams.set("sortBy", params.sortBy)
    if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder)
  
    const response = await fetch(`/api/leads?${searchParams.toString()}`)
  
    if (!response.ok) {
      throw new Error("Failed to fetch leads")
    }
  
    return response.json()
  }
  
  export async function deleteLead(id: number): Promise<void> {
    const response = await fetch(`/api/leads/${id}`, {
      method: "DELETE",
    })
  
    if (!response.ok) {
      throw new Error("Failed to delete lead")
    }
  }
  
  export async function updateLeadStatus(id: number, status: Lead["status"]): Promise<Lead> {
    const response = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    })
  
    if (!response.ok) {
      throw new Error("Failed to update lead status")
    }
  
    return response.json()
  }
  