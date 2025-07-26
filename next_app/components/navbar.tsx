"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, Wallet, User, Settings, LogOut, Server, ShoppingCart } from "lucide-react"

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { CustomConnectButton } from '../components/ConnectButton';

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });
  const [userAddress, setUserAddress] = useState("")

  const NavLinks = () => (
    <>
      <Link href="/marketplace" className="text-sm font-medium hover:text-primary transition-colors">
        Marketplace
      </Link>
      <Link href="#about" className="text-sm font-medium hover:text-primary transition-colors">
        About
      </Link>
      { isConnected && (
      <>
        <Link href="/orders" className="text-sm font-medium hover:text-primary transition-colors">
          Orders
        </Link>
        <Link href="/my-devices" className="text-sm font-medium hover:text-primary transition-colors">
          My Devices
        </Link>
      </>
      )}
      
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-violet/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg">
              <Server className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">MeshMind</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="text-center">
            <CustomConnectButton />
          </div>
          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 bg-transparent border-violet/30 hover:border-violet/50 transition-colors"
                >
                  <Wallet className="h-4 w-4" />
                  <span className="hidden sm:inline">{userAddress}</span>
                  <Badge variant="secondary" className="ml-1">
                    Connected
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-devices">
                    <Server className="mr-2 h-4 w-4" />
                    My Devices
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {/* <DropdownMenuItem onClick={disconnectWallet}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <></>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden bg-transparent">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
