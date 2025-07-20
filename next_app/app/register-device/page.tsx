"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Server, X } from "lucide-react"

const availableCapabilities = [
  "GPU Computing",
  "CPU Computing",
  "Machine Learning",
  "Data Processing",
  "Data Storage",
  "Web Scraping",
  "Rendering",
  "Analytics",
  "Database",
  "Edge Computing",
  "IoT Processing",
  "Real-time Analytics",
]

export default function RegisterDevicePage() {
  const [formData, setFormData] = useState({
    deviceName: "",
    metadataURI: "",
    pricePerHour: "",
    specifications: "",
    description: "",
  })
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCapabilities.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one capability for your device.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Simulate device registration
    setTimeout(() => {
      toast({
        title: "Device Registered Successfully!",
        description: "Your device is now listed in the marketplace and ready to receive orders.",
      })
      setIsLoading(false)
      // Reset form
      setFormData({
        deviceName: "",
        metadataURI: "",
        pricePerHour: "",
        specifications: "",
        description: "",
      })
      setSelectedCapabilities([])
    }, 2000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const toggleCapability = (capability: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(capability) ? prev.filter((c) => c !== capability) : [...prev, capability],
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Register Your Device</h1>
          <p className="text-muted-foreground">List your computing resources and start earning tokens</p>
        </div>

        <Card className="">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Device Registration
            </CardTitle>
            <CardDescription>Provide details about your device to attract potential renters</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name</Label>
                <Input
                  id="deviceName"
                  name="deviceName"
                  placeholder="e.g., High-Performance GPU Server"
                  value={formData.deviceName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specifications">Device Specifications</Label>
                <Textarea
                  id="specifications"
                  name="specifications"
                  placeholder="e.g., RTX 4090, 64GB RAM, 2TB SSD, Ubuntu 22.04"
                  value={formData.specifications}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your device's strengths and ideal use cases"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerHour">Price per Hour (in tokens)</Label>
                <Input
                  id="pricePerHour"
                  name="pricePerHour"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g., 5.2"
                  value={formData.pricePerHour}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metadataURI">Metadata URI (optional)</Label>
                <Input
                  id="metadataURI"
                  name="metadataURI"
                  placeholder="IPFS hash or URL for additional device metadata"
                  value={formData.metadataURI}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-3">
                <Label>Device Capabilities</Label>
                <p className="text-sm text-muted-foreground">Select all capabilities that your device supports</p>
                <div className="grid grid-cols-2 gap-3">
                  {availableCapabilities.map((capability) => (
                    <div key={capability} className="flex items-center space-x-2">
                      <Checkbox
                        id={capability}
                        checked={selectedCapabilities.includes(capability)}
                        onCheckedChange={() => toggleCapability(capability)}
                      />
                      <Label htmlFor={capability} className="text-sm">
                        {capability}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedCapabilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedCapabilities.map((capability) => (
                      <Badge key={capability} variant="secondary" className="flex items-center gap-1">
                        {capability}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCapability(capability)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Registration Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your device must be accessible and reliable</li>
                  <li>• Ensure stable internet connection for remote access</li>
                  <li>• Price competitively based on your device capabilities</li>
                  <li>• Maintain good reputation by completing orders successfully</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registering Device..." : "Register Device"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
