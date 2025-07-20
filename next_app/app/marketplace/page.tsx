"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Search, Filter, Star, Clock, Cpu, Zap } from "lucide-react"

// Mock data for devices
const mockDevices = [
  {
    id: 1,
    name: "High-Performance GPU Server",
    owner: "0x1234...5678",
    pricePerHour: 5.2,
    reputation: 950,
    capabilities: ["GPU Computing", "Machine Learning", "Rendering"],
    specs: "RTX 4090, 64GB RAM, 2TB SSD",
    isActive: true,
    totalOrders: 156,
    completedOrders: 152,
  },
  {
    id: 2,
    name: "CPU Cluster Node",
    owner: "0x8765...4321",
    pricePerHour: 2.8,
    reputation: 890,
    capabilities: ["CPU Computing", "Data Processing", "Web Scraping"],
    specs: "32-core CPU, 128GB RAM, 1TB NVMe",
    isActive: true,
    totalOrders: 89,
    completedOrders: 87,
  },
  {
    id: 3,
    name: "Storage & Analytics Server",
    owner: "0x9876...1234",
    pricePerHour: 1.5,
    reputation: 920,
    capabilities: ["Data Storage", "Analytics", "Database"],
    specs: "16-core CPU, 64GB RAM, 10TB Storage",
    isActive: true,
    totalOrders: 203,
    completedOrders: 198,
  },
  {
    id: 4,
    name: "Edge Computing Device",
    owner: "0x5432...8765",
    pricePerHour: 0.8,
    reputation: 780,
    capabilities: ["Edge Computing", "IoT Processing", "Real-time Analytics"],
    specs: "8-core ARM, 16GB RAM, 512GB SSD",
    isActive: true,
    totalOrders: 45,
    completedOrders: 43,
  },
]

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("reputation")
  const [filterCapability, setFilterCapability] = useState("all")

  const filteredDevices = mockDevices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.capabilities.some((cap) => cap.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterCapability === "all" || device.capabilities.includes(filterCapability)
    return matchesSearch && matchesFilter && device.isActive
  })

  const sortedDevices = [...filteredDevices].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.pricePerHour - b.pricePerHour
      case "price-high":
        return b.pricePerHour - a.pricePerHour
      case "reputation":
        return b.reputation - a.reputation
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Device Marketplace</h1>
          <p className="text-muted-foreground">Discover and rent computing power from device owners worldwide</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search devices or capabilities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterCapability} onValueChange={setFilterCapability}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by capability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Capabilities</SelectItem>
                  <SelectItem value="GPU Computing">GPU Computing</SelectItem>
                  <SelectItem value="CPU Computing">CPU Computing</SelectItem>
                  <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                  <SelectItem value="Data Processing">Data Processing</SelectItem>
                  <SelectItem value="Data Storage">Data Storage</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reputation">Reputation</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Device Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedDevices.map((device) => (
            <Card key={device.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                    <CardDescription className="mt-1">Owner: {device.owner}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {device.reputation}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="font-semibold">${device.pricePerHour}/hour</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Active
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Specifications:</p>
                  <p className="text-sm">{device.specs}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Capabilities:</p>
                  <div className="flex flex-wrap gap-1">
                    {device.capabilities.map((capability, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {device.completedOrders}/{device.totalOrders} completed
                  </div>
                  <div className="text-right">
                    Success Rate: {Math.round((device.completedOrders / device.totalOrders) * 100)}%
                  </div>
                </div>

                <Button className="w-full">Rent Device</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedDevices.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Cpu className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No devices found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
