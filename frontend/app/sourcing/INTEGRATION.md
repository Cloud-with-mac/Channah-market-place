# Backend Integration Guide

## Overview
This guide shows how to connect the Product Sourcing page to a backend API, replacing the current localStorage-based state management with real API calls.

## Current Implementation

### State Management
Currently uses Zustand with localStorage persistence:
```typescript
// frontend/store/sourcing-store.ts
export const useSourcingStore = create<SourcingState>()(
  persist(
    (set, get) => ({
      requests: [],
      // ... CRUD operations
    }),
    {
      name: 'vendora-sourcing',
    }
  )
)
```

## Backend API Requirements

### Endpoints Needed

#### 1. Sourcing Requests

```
GET    /api/v1/sourcing/requests
POST   /api/v1/sourcing/requests
GET    /api/v1/sourcing/requests/:id
PUT    /api/v1/sourcing/requests/:id
DELETE /api/v1/sourcing/requests/:id
PATCH  /api/v1/sourcing/requests/:id/close
PATCH  /api/v1/sourcing/requests/:id/award
```

#### 2. Bids

```
POST   /api/v1/sourcing/requests/:requestId/bids
GET    /api/v1/sourcing/requests/:requestId/bids
PUT    /api/v1/sourcing/requests/:requestId/bids/:bidId
DELETE /api/v1/sourcing/requests/:requestId/bids/:bidId
PATCH  /api/v1/sourcing/requests/:requestId/bids/:bidId/accept
PATCH  /api/v1/sourcing/requests/:requestId/bids/:bidId/reject
```

## Database Schema

### SourcingRequest Model

```python
# Backend model example (Python/SQLAlchemy)
class SourcingRequest(Base):
    __tablename__ = 'sourcing_requests'

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    quantity = Column(Integer, nullable=False)
    target_price = Column(Numeric(10, 2), nullable=True)
    budget = Column(Numeric(12, 2), nullable=True)
    deadline = Column(DateTime, nullable=True)
    destination = Column(String, nullable=False)
    specifications = Column(JSON, default=list)  # Array of {name, value}
    attachments = Column(JSON, default=list)  # Array of URLs
    status = Column(String, default='open')  # open, bidding, awarded, closed
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    awarded_to = Column(String, ForeignKey('vendors.id'), nullable=True)

    # Relationships
    bids = relationship('SourcingBid', back_populates='request', cascade='all, delete-orphan')
    creator = relationship('User', foreign_keys=[created_by])
    awarded_vendor = relationship('Vendor', foreign_keys=[awarded_to])
```

### SourcingBid Model

```python
class SourcingBid(Base):
    __tablename__ = 'sourcing_bids'

    id = Column(String, primary_key=True)
    request_id = Column(String, ForeignKey('sourcing_requests.id'), nullable=False)
    vendor_id = Column(String, ForeignKey('vendors.id'), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    moq = Column(Integer, nullable=False)  # Minimum Order Quantity
    lead_time = Column(String, nullable=False)
    payment_terms = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    certifications = Column(JSON, default=list)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default='pending')  # pending, accepted, rejected

    # Relationships
    request = relationship('SourcingRequest', back_populates='bids')
    vendor = relationship('Vendor')
```

## API Implementation

### FastAPI Example

```python
# backend/routes/sourcing.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional

router = APIRouter(prefix='/api/v1/sourcing', tags=['sourcing'])

# List requests
@router.get('/requests', response_model=List[SourcingRequestResponse])
async def list_requests(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user)
):
    query = db.query(SourcingRequest)

    if status:
        query = query.filter(SourcingRequest.status == status)
    if category:
        query = query.filter(SourcingRequest.category == category)
    if search:
        query = query.filter(
            or_(
                SourcingRequest.title.ilike(f'%{search}%'),
                SourcingRequest.description.ilike(f'%{search}%')
            )
        )

    total = query.count()
    requests = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        'results': requests,
        'total': total,
        'page': page,
        'page_size': page_size,
    }

# Create request
@router.post('/requests', response_model=SourcingRequestResponse)
async def create_request(
    data: SourcingRequestCreate,
    current_user: User = Depends(get_current_user)
):
    request = SourcingRequest(
        id=generate_id('sourcing'),
        **data.dict(),
        created_by=current_user.id,
        status='open'
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    # Send notifications to relevant vendors
    await notify_vendors(request)

    return request

# Get single request
@router.get('/requests/{request_id}', response_model=SourcingRequestResponse)
async def get_request(request_id: str):
    request = db.query(SourcingRequest).filter(SourcingRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail='Request not found')
    return request

# Update request
@router.put('/requests/{request_id}', response_model=SourcingRequestResponse)
async def update_request(
    request_id: str,
    data: SourcingRequestUpdate,
    current_user: User = Depends(get_current_user)
):
    request = db.query(SourcingRequest).filter(SourcingRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail='Request not found')
    if request.created_by != current_user.id:
        raise HTTPException(status_code=403, detail='Not authorized')

    for key, value in data.dict(exclude_unset=True).items():
        setattr(request, key, value)

    db.commit()
    db.refresh(request)
    return request

# Delete request
@router.delete('/requests/{request_id}')
async def delete_request(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    request = db.query(SourcingRequest).filter(SourcingRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail='Request not found')
    if request.created_by != current_user.id:
        raise HTTPException(status_code=403, detail='Not authorized')

    db.delete(request)
    db.commit()
    return {'message': 'Request deleted'}

# Close request
@router.patch('/requests/{request_id}/close')
async def close_request(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    request = db.query(SourcingRequest).filter(SourcingRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail='Request not found')
    if request.created_by != current_user.id:
        raise HTTPException(status_code=403, detail='Not authorized')

    request.status = 'closed'
    request.closed_at = datetime.utcnow()
    db.commit()

    # Notify vendors
    await notify_vendors_closed(request)

    return request

# Award request
@router.patch('/requests/{request_id}/award')
async def award_request(
    request_id: str,
    vendor_id: str,
    current_user: User = Depends(get_current_user)
):
    request = db.query(SourcingRequest).filter(SourcingRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail='Request not found')
    if request.created_by != current_user.id:
        raise HTTPException(status_code=403, detail='Not authorized')

    # Find the bid
    bid = db.query(SourcingBid).filter(
        SourcingBid.request_id == request_id,
        SourcingBid.vendor_id == vendor_id
    ).first()

    if not bid:
        raise HTTPException(status_code=404, detail='Bid not found')

    # Update request
    request.status = 'awarded'
    request.awarded_to = vendor_id
    request.closed_at = datetime.utcnow()

    # Update bid
    bid.status = 'accepted'

    # Reject other bids
    db.query(SourcingBid).filter(
        SourcingBid.request_id == request_id,
        SourcingBid.id != bid.id
    ).update({'status': 'rejected'})

    db.commit()

    # Send notifications
    await notify_award(request, bid)

    return request

# Submit bid
@router.post('/requests/{request_id}/bids', response_model=SourcingBidResponse)
async def submit_bid(
    request_id: str,
    data: SourcingBidCreate,
    current_vendor: Vendor = Depends(get_current_vendor)
):
    request = db.query(SourcingRequest).filter(SourcingRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail='Request not found')
    if request.status not in ['open', 'bidding']:
        raise HTTPException(status_code=400, detail='Request is not accepting bids')

    # Check if vendor already bid
    existing_bid = db.query(SourcingBid).filter(
        SourcingBid.request_id == request_id,
        SourcingBid.vendor_id == current_vendor.id
    ).first()

    if existing_bid:
        raise HTTPException(status_code=400, detail='You already submitted a bid')

    bid = SourcingBid(
        id=generate_id('bid'),
        request_id=request_id,
        vendor_id=current_vendor.id,
        **data.dict()
    )

    # Update request status
    if request.status == 'open':
        request.status = 'bidding'

    db.add(bid)
    db.commit()
    db.refresh(bid)

    # Notify buyer
    await notify_new_bid(request, bid)

    return bid
```

## Frontend Integration

### 1. Create API Client

```typescript
// lib/api/sourcing.ts
import { apiClient } from '@/lib/api-client'
import { SourcingRequest, SourcingBid } from '@/store/sourcing-store'

export const sourcingAPI = {
  // Requests
  async listRequests(params?: {
    status?: string
    category?: string
    search?: string
    page?: number
    page_size?: number
  }) {
    const { data } = await apiClient.get('/api/v1/sourcing/requests', { params })
    return data
  },

  async getRequest(id: string) {
    const { data } = await apiClient.get(`/api/v1/sourcing/requests/${id}`)
    return data
  },

  async createRequest(requestData: Partial<SourcingRequest>) {
    const { data } = await apiClient.post('/api/v1/sourcing/requests', requestData)
    return data
  },

  async updateRequest(id: string, updates: Partial<SourcingRequest>) {
    const { data } = await apiClient.put(`/api/v1/sourcing/requests/${id}`, updates)
    return data
  },

  async deleteRequest(id: string) {
    await apiClient.delete(`/api/v1/sourcing/requests/${id}`)
  },

  async closeRequest(id: string) {
    const { data } = await apiClient.patch(`/api/v1/sourcing/requests/${id}/close`)
    return data
  },

  async awardRequest(id: string, vendorId: string) {
    const { data } = await apiClient.patch(`/api/v1/sourcing/requests/${id}/award`, { vendor_id: vendorId })
    return data
  },

  // Bids
  async submitBid(requestId: string, bidData: Partial<SourcingBid>) {
    const { data } = await apiClient.post(`/api/v1/sourcing/requests/${requestId}/bids`, bidData)
    return data
  },

  async acceptBid(requestId: string, bidId: string) {
    const { data } = await apiClient.patch(`/api/v1/sourcing/requests/${requestId}/bids/${bidId}/accept`)
    return data
  },

  async rejectBid(requestId: string, bidId: string) {
    const { data } = await apiClient.patch(`/api/v1/sourcing/requests/${requestId}/bids/${bidId}/reject`)
    return data
  },
}
```

### 2. Update Store with API Calls

```typescript
// store/sourcing-store.ts (updated)
import { create } from 'zustand'
import { sourcingAPI } from '@/lib/api/sourcing'

interface SourcingState {
  requests: SourcingRequest[]
  isLoading: boolean
  error: string | null

  // Fetch
  fetchRequests: (filters?: any) => Promise<void>
  fetchRequest: (id: string) => Promise<void>

  // CRUD
  createRequest: (request: Partial<SourcingRequest>) => Promise<string>
  updateRequest: (id: string, updates: Partial<SourcingRequest>) => Promise<void>
  deleteRequest: (id: string) => Promise<void>

  // Actions
  closeRequest: (id: string) => Promise<void>
  awardRequest: (id: string, vendorId: string) => Promise<void>

  // Bids
  addBid: (requestId: string, bid: Partial<SourcingBid>) => Promise<void>
  acceptBid: (requestId: string, bidId: string) => Promise<void>
  rejectBid: (requestId: string, bidId: string) => Promise<void>
}

export const useSourcingStore = create<SourcingState>()((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,

  fetchRequests: async (filters) => {
    set({ isLoading: true, error: null })
    try {
      const data = await sourcingAPI.listRequests(filters)
      set({ requests: data.results, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  createRequest: async (requestData) => {
    set({ isLoading: true, error: null })
    try {
      const newRequest = await sourcingAPI.createRequest(requestData)
      set((state) => ({
        requests: [newRequest, ...state.requests],
        isLoading: false,
      }))
      return newRequest.id
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  deleteRequest: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await sourcingAPI.deleteRequest(id)
      set((state) => ({
        requests: state.requests.filter((req) => req.id !== id),
        isLoading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  awardRequest: async (id, vendorId) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await sourcingAPI.awardRequest(id, vendorId)
      set((state) => ({
        requests: state.requests.map((req) =>
          req.id === id ? updated : req
        ),
        isLoading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  addBid: async (requestId, bidData) => {
    set({ isLoading: true, error: null })
    try {
      const newBid = await sourcingAPI.submitBid(requestId, bidData)
      set((state) => ({
        requests: state.requests.map((req) =>
          req.id === requestId
            ? { ...req, bids: [...req.bids, newBid], status: 'bidding' }
            : req
        ),
        isLoading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // ... other methods
}))
```

### 3. Update Page Component

```typescript
// app/sourcing/page.tsx (updated)
'use client'

import { useEffect } from 'react'
import { useSourcingStore } from '@/store/sourcing-store'
import { useAuth } from '@/hooks/use-auth'

export default function SourcingPage() {
  const { user } = useAuth()
  const { requests, isLoading, error, fetchRequests } = useSourcingStore()

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Rest of component...

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  return (
    // Existing JSX...
  )
}
```

## Authentication Integration

### Replace Mock User IDs

```typescript
// Before (mock)
const CURRENT_USER_ID = 'buyer-123'
const CURRENT_VENDOR_ID = 'vendor-456'

// After (real auth)
import { useAuth } from '@/hooks/use-auth'

const { user } = useAuth()
const currentUserId = user?.id
const currentVendorId = user?.vendor?.id
const currentVendorName = user?.vendor?.name
```

## Real-time Updates (Optional)

### WebSocket Integration

```typescript
// lib/websocket/sourcing.ts
import { io } from 'socket.io-client'

export function setupSourcingWebSocket(userId: string) {
  const socket = io('/sourcing', {
    auth: { userId }
  })

  socket.on('new_bid', (data) => {
    // Update store
    useSourcingStore.getState().addBidRealtime(data.requestId, data.bid)
  })

  socket.on('request_awarded', (data) => {
    // Update store
    useSourcingStore.getState().updateRequestRealtime(data.requestId, {
      status: 'awarded',
      awardedTo: data.vendorId
    })
  })

  return socket
}
```

## Testing

### API Mocks for Development

```typescript
// lib/api/__mocks__/sourcing.ts
export const sourcingAPI = {
  async listRequests() {
    return Promise.resolve({ results: mockRequests })
  },

  async createRequest(data: any) {
    return Promise.resolve({
      ...data,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
    })
  },

  // ... other mocks
}
```

## Migration Steps

1. ✅ Create backend API endpoints
2. ✅ Set up database models and migrations
3. ✅ Create API client module
4. ✅ Update Zustand store with async actions
5. ✅ Replace mock user IDs with auth
6. ✅ Add loading and error states to UI
7. ✅ Test API integration
8. ✅ Add real-time updates (optional)
9. ✅ Deploy and monitor

## Security Considerations

- ✅ Authenticate all requests
- ✅ Authorize based on user role (buyer/vendor)
- ✅ Validate input data
- ✅ Sanitize user content
- ✅ Rate limit API endpoints
- ✅ Use HTTPS only
- ✅ Implement CSRF protection
- ✅ Add request logging

## Performance Optimization

- ✅ Implement pagination
- ✅ Add caching (Redis)
- ✅ Use database indexes
- ✅ Optimize queries (N+1 problem)
- ✅ Compress responses
- ✅ Add CDN for static assets
- ✅ Implement request throttling

## Monitoring

- Track API response times
- Monitor error rates
- Log user actions
- Set up alerts for failures
- Track conversion rates (bids to awards)
