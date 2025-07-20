"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Clock, CheckCircle, XCircle, AlertTriangle, Play } from "lucide-react"

// Mock order data
const mockOrders = [
  {
    id: 1,
    deviceName: "High-Performance GPU Server",
    deviceId: 1,
    action: "compute_lease",
    amount: 26.0,
    duration: 5,
    status: "COMPLETED",
    timestamp: "2024-01-15T10:30:00Z",
    completionTimestamp: "2024-01-15T15:30:00Z",
    taskDetails: "Machine learning model training",
    isOwner: false,
  },
  {
    id: 2,
    deviceName: "CPU Cluster Node",
    deviceId: 2,
    action: "data_access",
    amount: 8.4,
    duration: 3,
    status: "IN_PROGRESS",
    timestamp: "2024-01-16T14:00:00Z",
    taskDetails: "Data processing pipeline",
    isOwner: false,
  },
  {
    id: 3,
    deviceName: "My GPU Server",
    deviceId: 5,
    action: "compute_lease",
    amount: 15.6,
    duration: 3,
    status: "PENDING",
    timestamp: "2024-01-16T16:00:00Z",
    taskDetails: "Video rendering task",
    isOwner: true,
  },
  {
    id: 4,
    deviceName: "Storage Server",
    deviceId: 3,
    action: "data_access",
    amount: 4.5,
    duration: 3,
    status: "CANCELLED",
    timestamp: "2024-01-14T09:00:00Z",
    taskDetails: "Database backup",
    isOwner: false,
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "IN_PROGRESS":
      return <Play className="h-4 w-4 text-blue-600" />
    case "PENDING":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "CANCELLED":
      return <XCircle className="h-4 w-4 text-red-600" />
    case "DISPUTED":
      return <AlertTriangle className="h-4 w-4 text-orange-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-600" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    case "CANCELLED":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    case "DISPUTED":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all")

  const myOrders = mockOrders.filter((order) => !order.isOwner)
  const deviceOrders = mockOrders.filter((order) => order.isOwner)

  const OrderCard = ({ order }: { order: (typeof mockOrders)[0] }) => (
    <Card className="">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
            <CardDescription>{order.deviceName}</CardDescription>
          </div>
          <Badge className={getStatusColor(order.status)}>
            <div className="flex items-center gap-1">
              {getStatusIcon(order.status)}
              {order.status.replace("_", " ")}
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Action:</span>
            <p className="font-medium">{order.action.replace("_", " ")}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <p className="font-medium">{order.duration} hours</p>
          </div>
          <div>
            <span className="text-muted-foreground">Amount:</span>
            <p className="font-medium">${order.amount}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Started:</span>
            <p className="font-medium">{new Date(order.timestamp).toLocaleDateString()}</p>
          </div>
        </div>

        <Separator />

        <div>
          <span className="text-muted-foreground text-sm">Task Details:</span>
          <p className="text-sm mt-1">{order.taskDetails}</p>
        </div>

        {order.status === "PENDING" && order.isOwner && (
          <div className="flex gap-2">
            <Button size="sm" className="">
              Accept Order
            </Button>
            <Button size="sm" variant="outline">
              Decline
            </Button>
          </div>
        )}

        {order.status === "ACCEPTED" && order.isOwner && (
          <Button size="sm" className="">
            Start Order
          </Button>
        )}

        {order.status === "IN_PROGRESS" && order.isOwner && (
          <Button size="sm" className="">
            Mark Complete
          </Button>
        )}

        {order.status === "IN_PROGRESS" && !order.isOwner && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Cancel Order
            </Button>
            <Button size="sm" variant="destructive">
              Report Issue
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Management</h1>
          <p className="text-muted-foreground">Track your orders and manage device requests</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="my-orders">My Orders</TabsTrigger>
            <TabsTrigger value="device-orders">Device Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6 mt-6">
            <div className="grid gap-6">
              {mockOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-orders" className="space-y-6 mt-6">
            <div className="grid gap-6">
              {myOrders.length > 0 ? (
                myOrders.map((order) => <OrderCard key={order.id} order={order} />)
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                    <p className="text-muted-foreground">
                      Start by browsing the marketplace and placing your first order
                    </p>
                    <Button className="mt-4">Browse Marketplace</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="device-orders" className="space-y-6 mt-6">
            <div className="grid gap-6">
              {deviceOrders.length > 0 ? (
                deviceOrders.map((order) => <OrderCard key={order.id} order={order} />)
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No device orders</h3>
                    <p className="text-muted-foreground">Register your devices to start receiving orders from users</p>
                    <Button className="mt-4">Register Device</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
