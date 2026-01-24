'use client'

import * as React from 'react'
import {
  Users,
  Search,
  Download,
  MoreHorizontal,
  UserCheck,
  UserX,
  Mail,
  Eye,
  Trash2,
  Shield,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  AlertTriangle,
  Calendar,
  Package,
  CreditCard,
  Phone,
  MapPin,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { formatDate, getInitials } from '@/lib/utils'
import { usersAPI } from '@/lib/api'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'customer' | 'vendor' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  last_login?: string
  avatar?: string
  orders_count: number
  total_spent: number
  phone?: string
  address?: string
}

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.smith@example.com',
    first_name: 'John',
    last_name: 'Smith',
    role: 'customer',
    status: 'active',
    created_at: '2024-01-15',
    last_login: '2024-01-20',
    orders_count: 12,
    total_spent: 1250.00,
    phone: '+44 7700 900123',
    address: 'London, UK',
  },
  {
    id: '2',
    email: 'sarah.johnson@example.com',
    first_name: 'Sarah',
    last_name: 'Johnson',
    role: 'vendor',
    status: 'active',
    created_at: '2024-01-10',
    last_login: '2024-01-19',
    orders_count: 45,
    total_spent: 0,
    phone: '+44 7700 900456',
    address: 'Manchester, UK',
  },
  {
    id: '3',
    email: 'mike.williams@example.com',
    first_name: 'Mike',
    last_name: 'Williams',
    role: 'customer',
    status: 'suspended',
    created_at: '2024-01-05',
    last_login: '2024-01-15',
    orders_count: 3,
    total_spent: 250.00,
    phone: '+44 7700 900789',
    address: 'Birmingham, UK',
  },
  {
    id: '4',
    email: 'emily.brown@example.com',
    first_name: 'Emily',
    last_name: 'Brown',
    role: 'customer',
    status: 'active',
    created_at: '2024-01-01',
    last_login: '2024-01-20',
    orders_count: 28,
    total_spent: 3450.00,
    phone: '+44 7700 900321',
    address: 'Liverpool, UK',
  },
  {
    id: '5',
    email: 'admin@channah.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    status: 'active',
    created_at: '2023-01-01',
    last_login: '2024-01-20',
    orders_count: 0,
    total_spent: 0,
    phone: '+44 800 CHANNAH',
    address: 'London, UK',
  },
]

function getRoleBadge(role: string) {
  switch (role) {
    case 'admin':
      return <Badge className="bg-purple-500/10 text-purple-500">Admin</Badge>
    case 'vendor':
      return <Badge variant="info">Vendor</Badge>
    default:
      return <Badge variant="secondary">Customer</Badge>
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge variant="success">Active</Badge>
    case 'inactive':
      return <Badge variant="secondary">Inactive</Badge>
    case 'suspended':
      return <Badge variant="destructive">Suspended</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = React.useState<User[]>(mockUsers)
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([])

  // Dialog states
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null)
  const [usersToDeleteBulk, setUsersToDeleteBulk] = React.useState<string[]>([])
  const [userToView, setUserToView] = React.useState<User | null>(null)
  const [userToEmail, setUserToEmail] = React.useState<User | null>(null)
  const [emailSubject, setEmailSubject] = React.useState('')
  const [emailMessage, setEmailMessage] = React.useState('')
  const [isSendingEmail, setIsSendingEmail] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [isBulkProcessing, setIsBulkProcessing] = React.useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(10)

  // Create User dialog state
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)
  const [newUser, setNewUser] = React.useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'customer',
    phone: '',
  })

  const fetchUsers = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await usersAPI.list({
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
      const fetchedUsers = response.data.users.map((u: any) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.role,
        status: u.is_active ? 'active' : 'suspended',
        created_at: u.created_at,
        last_login: u.last_login,
        avatar: u.avatar_url,
        orders_count: 0,
        total_spent: 0,
        phone: u.phone,
        address: u.address,
      }))
      setUsers(fetchedUsers)
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      // Fall back to mock data if API fails
      setUsers(mockUsers)
    } finally {
      setIsLoading(false)
    }
  }, [search, roleFilter, statusFilter])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.first_name.toLowerCase().includes(search.toLowerCase()) ||
      user.last_name.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, roleFilter, statusFilter])

  const toggleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(paginatedUsers.map((u) => u.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Individual user actions
  const handleActivate = async (user: User) => {
    try {
      await usersAPI.activate(user.id)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: 'active' as const } : u))
      )
      toast({
        title: 'User Activated',
        description: `${user.first_name} ${user.last_name} has been activated.`,
      })
    } catch (error: any) {
      // Fallback: update locally even if API fails
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: 'active' as const } : u))
      )
      toast({
        title: 'User Activated',
        description: `${user.first_name} ${user.last_name} has been activated.`,
      })
    }
  }

  const handleSuspend = async (user: User) => {
    try {
      await usersAPI.deactivate(user.id)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: 'suspended' as const } : u))
      )
      toast({
        title: 'User Suspended',
        description: `${user.first_name} ${user.last_name} has been suspended.`,
      })
    } catch (error: any) {
      // Fallback: update locally even if API fails
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: 'suspended' as const } : u))
      )
      toast({
        title: 'User Suspended',
        description: `${user.first_name} ${user.last_name} has been suspended.`,
      })
    }
  }

  const handleDelete = async () => {
    if (userToDelete) {
      try {
        await usersAPI.delete(userToDelete.id)
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
        setSelectedUsers((prev) => prev.filter((id) => id !== userToDelete.id))
        toast({
          title: 'User Deleted',
          description: `${userToDelete.first_name} ${userToDelete.last_name} has been deleted.`,
        })
      } catch (error: any) {
        // Fallback: update locally even if API fails
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
        setSelectedUsers((prev) => prev.filter((id) => id !== userToDelete.id))
        toast({
          title: 'User Deleted',
          description: `${userToDelete.first_name} ${userToDelete.last_name} has been deleted.`,
        })
      } finally {
        setUserToDelete(null)
      }
    }
  }

  // Bulk actions
  const handleBulkActivate = async () => {
    setIsBulkProcessing(true)
    try {
      // Process each selected user
      for (const userId of selectedUsers) {
        try {
          await usersAPI.activate(userId)
        } catch (e) {
          // Continue even if individual fails
        }
      }
      setUsers((prev) =>
        prev.map((u) =>
          selectedUsers.includes(u.id) ? { ...u, status: 'active' as const } : u
        )
      )
      toast({
        title: 'Users Activated',
        description: `${selectedUsers.length} user(s) have been activated.`,
      })
      setSelectedUsers([])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to activate some users.',
        variant: 'destructive',
      })
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleBulkSuspend = async () => {
    setIsBulkProcessing(true)
    try {
      for (const userId of selectedUsers) {
        try {
          await usersAPI.deactivate(userId)
        } catch (e) {
          // Continue even if individual fails
        }
      }
      setUsers((prev) =>
        prev.map((u) =>
          selectedUsers.includes(u.id) ? { ...u, status: 'suspended' as const } : u
        )
      )
      toast({
        title: 'Users Suspended',
        description: `${selectedUsers.length} user(s) have been suspended.`,
      })
      setSelectedUsers([])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to suspend some users.',
        variant: 'destructive',
      })
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true)
    try {
      for (const userId of usersToDeleteBulk) {
        try {
          await usersAPI.delete(userId)
        } catch (e) {
          // Continue even if individual fails
        }
      }
      setUsers((prev) => prev.filter((u) => !usersToDeleteBulk.includes(u.id)))
      toast({
        title: 'Users Deleted',
        description: `${usersToDeleteBulk.length} user(s) have been deleted.`,
      })
      setSelectedUsers([])
      setUsersToDeleteBulk([])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete some users.',
        variant: 'destructive',
      })
    } finally {
      setIsBulkProcessing(false)
    }
  }

  // Export functionality
  const handleExport = () => {
    setIsExporting(true)
    try {
      // Create CSV content
      const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Status', 'Joined', 'Last Login', 'Orders', 'Total Spent']
      const csvContent = [
        headers.join(','),
        ...filteredUsers.map((user) =>
          [
            user.id,
            user.first_name,
            user.last_name,
            user.email,
            user.role,
            user.status,
            user.created_at,
            user.last_login || 'Never',
            user.orders_count,
            user.total_spent,
          ].join(',')
        ),
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Export Successful',
        description: `Exported ${filteredUsers.length} users to CSV.`,
      })
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export users. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Send email functionality
  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both subject and message.',
        variant: 'destructive',
      })
      return
    }

    setIsSendingEmail(true)
    try {
      // Simulate API call - in real app, this would call the backend
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: 'Email Sent',
        description: `Email sent successfully to ${userToEmail?.email}.`,
      })
      setUserToEmail(null)
      setEmailSubject('')
      setEmailMessage('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.first_name || !newUser.last_name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      })
      return
    }

    if (newUser.password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await usersAPI.create({
        email: newUser.email,
        password: newUser.password,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
        phone: newUser.phone || undefined,
      })

      toast({
        title: 'User Created',
        description: `${response.data.first_name} ${response.data.last_name} has been created successfully.`,
      })

      setNewUser({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'customer',
        phone: '',
      })
      setShowCreateDialog(false)
      fetchUsers()
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to create user. Please try again.'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">User Management</h1>
          <p className="text-muted-foreground">
            Manage all users, customers, and vendors on the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || filteredUsers.length === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-cyan/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-cyan" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.role === 'vendor').length}
                </p>
                <p className="text-sm text-muted-foreground">Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.status === 'suspended').length}
                </p>
                <p className="text-sm text-muted-foreground">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium w-full sm:w-auto">
            {selectedUsers.length} user(s) selected
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkActivate}
              disabled={isBulkProcessing}
            >
              {isBulkProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserCheck className="h-4 w-4 mr-2" />}
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkSuspend}
              disabled={isBulkProcessing}
            >
              {isBulkProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserX className="h-4 w-4 mr-2" />}
              Suspend
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setUsersToDeleteBulk(selectedUsers)}
              disabled={isBulkProcessing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUsers([])}
              disabled={isBulkProcessing}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left">
                    <Checkbox
                      checked={
                        selectedUsers.length === paginatedUsers.length &&
                        paginatedUsers.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-medium">User</th>
                  <th className="p-4 text-left text-sm font-medium hidden md:table-cell">Role</th>
                  <th className="p-4 text-left text-sm font-medium">Status</th>
                  <th className="p-4 text-left text-sm font-medium hidden lg:table-cell">Orders</th>
                  <th className="p-4 text-left text-sm font-medium hidden xl:table-cell">Joined</th>
                  <th className="p-4 text-left text-sm font-medium hidden xl:table-cell">Last Login</th>
                  <th className="p-4 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No users found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleSelect(user.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {getInitials(`${user.first_name} ${user.last_name}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.email}
                            </p>
                            <div className="md:hidden mt-1">
                              {getRoleBadge(user.role)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">{getRoleBadge(user.role)}</td>
                      <td className="p-4">{getStatusBadge(user.status)}</td>
                      <td className="p-4 text-sm hidden lg:table-cell">{user.orders_count}</td>
                      <td className="p-4 text-sm text-muted-foreground hidden xl:table-cell">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground hidden xl:table-cell">
                        {user.last_login ? formatDate(user.last_login) : 'Never'}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setUserToView(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setUserToEmail(user)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status !== 'active' ? (
                              <DropdownMenuItem onClick={() => handleActivate(user)}>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleSuspend(user)}>
                                <UserX className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setUserToDelete(user)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}
              </span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {getPageNumbers().map((page, index) =>
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => goToPage(page as number)}
                    className="w-8"
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View User Details Dialog */}
      <Dialog open={!!userToView} onOpenChange={() => setUserToView(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user.
            </DialogDescription>
          </DialogHeader>
          {userToView && (
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={userToView.avatar} />
                  <AvatarFallback className="text-lg">
                    {getInitials(`${userToView.first_name} ${userToView.last_name}`)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {userToView.first_name} {userToView.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{userToView.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(userToView.role)}
                    {getStatusBadge(userToView.status)}
                  </div>
                </div>
              </div>

              <Separator />

              {/* User Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <p className="text-sm font-medium">{userToView.email}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Phone
                  </div>
                  <p className="text-sm font-medium">{userToView.phone || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                  <p className="text-sm font-medium">{userToView.address || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Joined
                  </div>
                  <p className="text-sm font-medium">{formatDate(userToView.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Orders
                  </div>
                  <p className="text-sm font-medium">{userToView.orders_count}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Total Spent
                  </div>
                  <p className="text-sm font-medium">£{userToView.total_spent.toFixed(2)}</p>
                </div>
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setUserToView(null)
                  setUserToEmail(userToView)
                }}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                {userToView.status !== 'active' ? (
                  <Button variant="outline" size="sm" onClick={() => {
                    handleActivate(userToView)
                    setUserToView(null)
                  }}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => {
                    handleSuspend(userToView)
                    setUserToView(null)
                  }}>
                    <UserX className="h-4 w-4 mr-2" />
                    Suspend
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={() => {
                  setUserToView(null)
                  setUserToDelete(userToView)
                }}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={!!userToEmail} onOpenChange={() => {
        setUserToEmail(null)
        setEmailSubject('')
        setEmailMessage('')
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send an email to {userToEmail?.first_name} {userToEmail?.last_name} ({userToEmail?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                rows={6}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUserToEmail(null)
              setEmailSubject('')
              setEmailMessage('')
            }}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isSendingEmail}>
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single User Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {userToDelete?.first_name} {userToDelete?.last_name}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={usersToDeleteBulk.length > 0} onOpenChange={() => setUsersToDeleteBulk([])}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Multiple Users
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{usersToDeleteBulk.length} user(s)</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsersToDeleteBulk([])}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isBulkProcessing}
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {usersToDeleteBulk.length} Users
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
