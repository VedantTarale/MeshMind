"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Server, Settings, TrendingUp, Clock, DollarSign, Plus } from "lucide-react"
import Link from "next/link"

// Mock device data
const mockDevices = [
  {
    id: 1,
    name: "My GPU Server",
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
    name: "CPU Workstation",
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
]

export default function MyDevicesPage() {
  const [devices, setDevices] = useState(mockDevices)
  const { toast } = useToast()

  const toggleDeviceStatus = (deviceId: number) => {
    setDevices((prev) =>
      prev.map((device) => (device.id === deviceId ? { ...device, isActive: !device.isActive } : device)),
    )

    const device = devices.find((d) => d.id === deviceId)
    toast({
      title: `Device ${device?.isActive ? "Deactivated" : "Activated"}`,
      description: `${device?.name} is now ${device?.isActive ? "offline" : "online"} and ${device?.isActive ? "not accepting" : "accepting"} new orders.`,
    })
  }

  const totalEarnings = devices.reduce((sum, device) => sum + device.totalEarnings, 0)
  const totalOrders = devices.reduce((sum, device) => sum + device.totalOrders, 0)
  const activeDevices = devices.filter((device) => device.isActive).length

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Devices</h1>
            <p className="text-muted-foreground">Manage your registered computing devices</p>
          </div>
          <Button asChild>
            <Link href="/register-device">
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Link>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">{totalEarnings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{totalOrders}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Devices</p>
                  <p className="text-2xl font-bold">
                    {activeDevices}/{devices.length}
                  </p>
                </div>
                <Server className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Rating</p>
                  <p className="text-2xl font-bold">
                    {(devices.reduce((sum, d) => sum + d.reputation, 0) / devices.length / 10).toFixed(1)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Device List */}
        <div className="space-y-6">
          {devices.map((device) => (
            <Card key={device.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      {device.name}
                    </CardTitle>
                    <CardDescription className="mt-1">{device.specs}</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="flex items-center gap-2">
                        <Switch checked={device.isActive} onCheckedChange={() => toggleDeviceStatus(device.id)} />
                        <Badge variant={device.isActive ? "default" : "secondary"}>
                          {device.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Price per Hour</p>
                    <p className="font-semibold">${device.pricePerHour}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reputation</p>
                    <p className="font-semibold">{device.reputation}/1000</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="font-semibold">${device.totalEarnings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="font-semibold">{Math.round((device.completedOrders / device.totalOrders) * 100)}%</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Capabilities</p>
                  <div className="flex flex-wrap gap-2">
                    {device.capabilities.map((capability, index) => (
                      <Badge key={index} variant="outline">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {device.completedOrders}/{device.totalOrders} orders completed
                    {device.currentOrders > 0 && (
                      <span className="ml-2 text-blue-600">• {device.currentOrders} active orders</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button variant="outline" size="sm">
                      View Orders
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {devices.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No devices registered</h3>
              <p className="text-muted-foreground mb-4">Start earning by registering your first computing device</p>
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
  )
}
