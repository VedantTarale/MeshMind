"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, Wallet } from "lucide-react"

import { useWriteContract } from "wagmi"
import { contractABI as abi} from "@/constants/abi"
import { contractAddress } from "@/constants/contractAddress"

export default function RegisterPage() {
  const { writeContract } = useWriteContract();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    contactInfo: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await writeContract({
        abi,
        address: contractAddress,
        functionName: "registerUser",
        args: [formData.username, formData.contactInfo],
      });
      console.log(formData);
      
      // Show success toast
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully!",
        variant: "default",
      })
      
      // Redirect to profile page
      router.push("/profile");
      
    } catch (error) {
      console.error("Error registering user:", error)
      toast({
        title: "Registration Failed",
        description: "There was an error registering your account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
          <p className="text-muted-foreground">Join the decentralized compute marketplace</p>
        </div>

        <Card className="">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              User Registration
            </CardTitle>
            <CardDescription>Register to start renting computing power or listing your devices</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactInfo">Contact Information</Label>
                <Textarea
                  id="contactInfo"
                  name="contactInfo"
                  placeholder="Additional contact details (optional)"
                  value={formData.contactInfo}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4" />
                  <span className="font-medium">Wallet Connection Required</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Make sure your Web3 wallet is connected before registering. This will be your identity on the
                  blockchain.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Register Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}