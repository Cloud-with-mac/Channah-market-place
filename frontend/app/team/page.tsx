'use client'

import { useState } from 'react'
import { useTeamStore } from '@/store/team-store'
import type { TeamMember } from '@/store/team-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  UserPlus,
  Shield,
  Eye,
  ShoppingCart,
  Settings,
  MoreVertical,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

const ROLE_CONFIG = {
  owner: {
    label: 'Owner',
    color: 'bg-purple-600',
    icon: Shield,
    description: 'Full access to all features including billing',
  },
  admin: {
    label: 'Admin',
    color: 'bg-blue-600',
    icon: Settings,
    description: 'Manage team and place orders',
  },
  buyer: {
    label: 'Buyer',
    color: 'bg-green-600',
    icon: ShoppingCart,
    description: 'Create RFQs and place orders',
  },
  viewer: {
    label: 'Viewer',
    color: 'bg-gray-600',
    icon: Eye,
    description: 'View-only access to documents',
  },
}

export default function TeamPage() {
  const {
    teamMembers,
    activities,
    inviteMember,
    removeMember,
    updateRole,
    suspendMember,
    activateMember,
    getRecentActivity,
  } = useTeamStore()

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'buyer' as TeamMember['role'],
  })

  const handleInvite = () => {
    if (!inviteForm.email || !inviteForm.name) {
      toast({
        title: 'Missing information',
        description: 'Please enter email and name',
        variant: 'destructive',
      })
      return
    }

    inviteMember(inviteForm.email, inviteForm.name, inviteForm.role)

    toast({
      title: 'Invitation sent',
      description: `An invitation has been sent to ${inviteForm.email}`,
    })

    setInviteForm({ email: '', name: '', role: 'buyer' })
    setIsInviteDialogOpen(false)
  }

  const activeMembers = teamMembers.filter((m) => m.status === 'active')
  const pendingMembers = teamMembers.filter((m) => m.status === 'pending')
  const recentActivities = getRecentActivity(10)

  return (
    <div className="container py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2">Team Collaboration</h1>
          <p className="text-muted-foreground">
            Manage team members and shared resources
          </p>
        </div>

        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <UserPlus className="h-5 w-5 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Add a new team member to your organization account
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <Label htmlFor="role">Role & Permissions</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value: TeamMember['role']) =>
                    setInviteForm({ ...inviteForm, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          <div>
                            <p className="font-semibold">{config.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {config.description}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite}>Send Invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Members</p>
              <p className="text-2xl font-bold">{activeMembers.length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Invites</p>
              <p className="text-2xl font-bold">{pendingMembers.length}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Team Activity</p>
              <p className="text-2xl font-bold">{activities.length}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Team Members */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Team Members</h2>

            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No team members yet</h3>
                <p className="text-muted-foreground mb-6">
                  Invite team members to collaborate on orders and RFQs
                </p>
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite First Member
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => {
                  const roleConfig = ROLE_CONFIG[member.role]
                  const RoleIcon = roleConfig.icon

                  return (
                    <Card key={member.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{member.name}</h4>
                              <Badge className={roleConfig.color}>
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {roleConfig.label}
                              </Badge>
                              {member.status === 'pending' && (
                                <Badge variant="outline">Pending</Badge>
                              )}
                              {member.status === 'suspended' && (
                                <Badge variant="destructive">Suspended</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {member.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Invited {formatDistanceToNow(new Date(member.invitedAt))} ago
                              {member.lastActive && ` • Last active ${formatDistanceToNow(new Date(member.lastActive))} ago`}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(value: TeamMember['role']) =>
                              updateRole(member.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {member.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => suspendMember(member.id)}
                            >
                              Suspend
                            </Button>
                          )}
                          {member.status === 'suspended' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => activateMember(member.id)}
                            >
                              Activate
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Remove ${member.name} from team?`)) {
                                removeMember(member.id)
                                toast({
                                  title: 'Member removed',
                                  description: `${member.name} has been removed from the team`,
                                })
                              }
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Recent Activity</h2>

            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.details}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp))} ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
