"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Calendar, Star, Server, DollarSign, Clock, Settings, Plus, UserPlus, Wallet, Phone } from "lucide-react"
import Link from "next/link"
import { useAccount, useBalance } from 'wagmi';

import { useReadContracts } from "wagmi"
import { contractABI as abi} from "@/constants/abi"
import { contractAddress } from "@/constants/contractAddress"

// Mock user profile data
const mockUserProfile = {
  username: "alex_dev",
  email: "alex@example.com",
  contactInfo: "Discord: alex_dev#1234, Telegram: @alexdev",
  walletAddress: "0x1234...5678",
  reputation: 875,
  joinDate: "2023-08-15",
  totalEarnings: 1247.8,
  totalOrders: 89,
  completedOrders: 85,
  isRegistered: true, // Set to false to test registration flow
}

// Mock device data for profile view
const mockDevices = [
  {
    id: 1,
    name: "GPU Workstation Pro",
    specs: "RTX 4090, 64GB RAM, 2TB SSD",
    pricePerHour: 5.2,
    reputation: 950,
    capabilities: ["GPU Computing", "Machine Learning", "Rendering"],
    isActive: true,
    totalOrders: 156,
    completedOrders: 152,
    totalEarnings: 812.4,
    currentOrders: 2,
  },
  {
    id: 2,
    name: "CPU Cluster Node",
    specs: "32-core CPU, 128GB RAM, 1TB NVMe",
    pricePerHour: 2.8,
    reputation: 890,
    capabilities: ["CPU Computing", "Data Processing"],
    isActive: false,
    totalOrders: 89,
    completedOrders: 87,
    totalEarnings: 249.2,
    currentOrders: 0,
  },
  {
    id: 3,
    name: "Storage Server",
    specs: "16-core CPU, 64GB RAM, 10TB Storage",
    pricePerHour: 1.5,
    reputation: 920,
    capabilities: ["Data Storage", "Analytics", "Database"],
    isActive: true,
    totalOrders: 203,
    completedOrders: 198,
    totalEarnings: 186.2,
    currentOrders: 1,
  },
]

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [devices, setDevices] = useState(mockDevices)
  const { toast } = useToast()

  const { data, isLoading, isError, error } = useReadContracts({
        contracts: [
            {
                abi,
                address: contractAddress,
                functionName: 'getUserProfile',
                args: [address],
            },
            {
                abi,
                address: contractAddress,
                functionName: 'getUserDevices',
                args: [address],
            }
        ]

    });  
  const userProfile = data?.[0]?.result;
  const userDevices = data?.[1]?.result;
  // TODO: Add actual profile checking logic here
  const isProfilePresent = mockUserProfile.isRegistered

  const toggleDeviceStatus = (deviceId: number) => {
    setDevices((prev) =>
      prev.map((device) => (device.id === deviceId ? { ...device, isActive: !device.isActive } : device)),
    )

    const device = devices.find((d) => d.id === deviceId)
    toast({
      title: `Device ${device?.isActive ? "Deactivated" : "Activated"}`,
      description: `${device?.name} is now ${device?.isActive ? "offline" : "online"}.`,
    })
  }

  // Registration prompt when profile doesn't exist
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="border-2 border-dashed border-muted-foreground/25">
            <CardContent className="pt-12 pb-12">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-4">Welcome to MeshMind</h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                To access your profile and start using the platform, you'll need to create an account first.
              </p>

              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="font-medium">Wallet Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Make sure your Web3 wallet is connected to create your decentralized identity.
                  </p>
                </div>

                <Button size="lg" className="w-full max-w-sm" asChild>
                  <Link href="/register">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create Account
                  </Link>
                </Button>

                <p className="text-sm text-muted-foreground">
                  Already have an account? Connect your wallet to access your profile.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main profile view when user is registered
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and computing devices</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" />
                    <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl">{userProfile?.username}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Contact Information{": "}
                      <p className="text-sm text-muted-foreground">{userProfile?.contactInfo}</p>
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold"></h4>
                  <p className="text-sm text-muted-foreground">{mockUserProfile.contactInfo}</p>
                </div>

                <Separator />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">${mockUserProfile.totalEarnings}</div>
                    <div className="text-xs text-muted-foreground">Total Earnings</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{mockUserProfile.completedOrders}</div>
                    <div className="text-xs text-muted-foreground">Orders Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Devices Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">My Devices</h2>
                <p className="text-muted-foreground">Manage your computing resources</p>
              </div>
              <Button asChild>
                <Link href="/register-device">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Device
                </Link>
              </Button>
            </div>

            {/* Device Stats */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Devices</p>
                      <p className="text-2xl font-bold">
                        {devices.filter((d) => d.isActive).length}/{devices.length}
                      </p>
                    </div>
                    <Server className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                      <p className="text-2xl font-bold">
                        ${devices.reduce((sum, d) => sum + d.totalEarnings, 0).toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Orders</p>
                      <p className="text-2xl font-bold">{devices.reduce((sum, d) => sum + d.currentOrders, 0)}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Device List */}
            <div className="space-y-4">
              {devices.map((device) => (
                <Card key={device.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Server className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">{device.name}</h3>
                          <Badge variant={device.isActive ? "default" : "secondary"}>
                            {device.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{device.specs}</p>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {device.capabilities.map((capability, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Switch checked={device.isActive} onCheckedChange={() => toggleDeviceStatus(device.id)} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Price/Hour:</span>
                        <p className="font-semibold">${device.pricePerHour}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reputation:</span>
                        <p className="font-semibold">{device.reputation}/1000</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Earnings:</span>
                        <p className="font-semibold">${device.totalEarnings}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Success Rate:</span>
                        <p className="font-semibold">
                          {Math.round((device.completedOrders / device.totalOrders) * 100)}%
                        </p>
                      </div>
                    </div>

                    {device.currentOrders > 0 && (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {device.currentOrders} active order{device.currentOrders > 1 ? "s" : ""}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {devices.length === 0 && (
                <Card className="text-center py-12 border-2 border-dashed border-muted-foreground/25">
                  <CardContent>
                    <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No devices registered</h3>
                    <p className="text-muted-foreground mb-4">
                      Start earning by registering your first computing device
                    </p>
                    <Button asChild>
                      <Link href="/register-device">
                        <Plus className="h-4 w-4 mr-2" />
                        Register Your First Device
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
