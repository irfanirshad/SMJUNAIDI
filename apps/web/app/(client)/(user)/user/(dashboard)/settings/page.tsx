"use client";

import React, { useState } from "react";
import {
  User,
  Bell,
  Lock,
  CreditCard,
  Globe,
  Shield,
  Eye,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(true);

  return (
    <div className="min-h-screen bg-babyshopLightBg p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-babyshopBlack mb-2">
            Settings
          </h1>
          <p className="text-babyshopTextLight">
            Manage your account preferences and security
          </p>
        </div>

        {/* Account Settings */}
        <Card className="shadow-md border border-babyshopTextLight/20">
          <CardHeader className="bg-linear-to-r from-babyshopSky/5 to-babyshopPurple/5">
            <CardTitle className="flex items-center gap-2 text-babyshopBlack">
              <User className="w-5 h-5 text-babyshopSky" />
              Account Information
            </CardTitle>
            <CardDescription>
              Manage your personal details and profile
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Link href="/user/profile" className="block group">
                <div className="flex items-center justify-between p-4 rounded-lg border border-babyshopTextLight/20 hover:border-babyshopSky/50 hover:bg-babyshopSky/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-babyshopSky/10 rounded-lg group-hover:bg-babyshopSky/20 transition-colors">
                      <User className="w-5 h-5 text-babyshopSky" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-babyshopBlack">
                        Profile Settings
                      </h4>
                      <p className="text-sm text-babyshopTextLight">
                        Update name, avatar, and contact info
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-babyshopTextLight group-hover:text-babyshopSky transition-colors" />
                </div>
              </Link>

              <div className="flex items-center justify-between p-4 rounded-lg border border-babyshopTextLight/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-babyshopPurple/10 rounded-lg">
                    <Globe className="w-5 h-5 text-babyshopPurple" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-babyshopBlack">
                      Language & Region
                    </h4>
                    <p className="text-sm text-babyshopTextLight">
                      English (US)
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-babyshopSky/10 text-babyshopSky border-babyshopSky/20"
                >
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="shadow-md border border-babyshopTextLight/20">
          <CardHeader className="bg-linear-to-r from-babyshopSky/5 to-babyshopPurple/5">
            <CardTitle className="flex items-center gap-2 text-babyshopBlack">
              <Shield className="w-5 h-5 text-babyshopSky" />
              Security & Privacy
            </CardTitle>
            <CardDescription>
              Manage your password and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Link href="/user/profile" className="block group">
                <div className="flex items-center justify-between p-4 rounded-lg border border-babyshopTextLight/20 hover:border-babyshopSky/50 hover:bg-babyshopSky/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-babyshopSky/10 rounded-lg group-hover:bg-babyshopSky/20 transition-colors">
                      <Lock className="w-5 h-5 text-babyshopSky" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-babyshopBlack">
                        Change Password
                      </h4>
                      <p className="text-sm text-babyshopTextLight">
                        Update your account password
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-babyshopTextLight group-hover:text-babyshopSky transition-colors" />
                </div>
              </Link>

              <div className="flex items-center justify-between p-4 rounded-lg border border-babyshopTextLight/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Eye className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-babyshopBlack">
                      Privacy Settings
                    </h4>
                    <p className="text-sm text-babyshopTextLight">
                      Control data visibility
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 border-green-200"
                >
                  Secure
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="shadow-md border border-babyshopTextLight/20">
          <CardHeader className="bg-linear-to-r from-babyshopSky/5 to-babyshopPurple/5">
            <CardTitle className="flex items-center gap-2 text-babyshopBlack">
              <Bell className="w-5 h-5 text-babyshopSky" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you want to be notified
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="email-notifications"
                    className="text-base font-semibold text-babyshopBlack"
                  >
                    Email Notifications
                  </Label>
                  <p className="text-sm text-babyshopTextLight">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  className="data-[state=checked]:bg-babyshopSky"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="push-notifications"
                    className="text-base font-semibold text-babyshopBlack"
                  >
                    Push Notifications
                  </Label>
                  <p className="text-sm text-babyshopTextLight">
                    Receive push notifications
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                  className="data-[state=checked]:bg-babyshopSky"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="order-updates"
                    className="text-base font-semibold text-babyshopBlack"
                  >
                    Order Updates
                  </Label>
                  <p className="text-sm text-babyshopTextLight">
                    Get notified about order status
                  </p>
                </div>
                <Switch
                  id="order-updates"
                  checked={orderUpdates}
                  onCheckedChange={setOrderUpdates}
                  className="data-[state=checked]:bg-babyshopSky"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="promotions"
                    className="text-base font-semibold text-babyshopBlack"
                  >
                    Promotions & Offers
                  </Label>
                  <p className="text-sm text-babyshopTextLight">
                    Receive special deals and discounts
                  </p>
                </div>
                <Switch
                  id="promotions"
                  checked={promotions}
                  onCheckedChange={setPromotions}
                  className="data-[state=checked]:bg-babyshopSky"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="shadow-md border border-babyshopTextLight/20">
          <CardHeader className="bg-linear-to-r from-babyshopSky/5 to-babyshopPurple/5">
            <CardTitle className="flex items-center gap-2 text-babyshopBlack">
              <CreditCard className="w-5 h-5 text-babyshopSky" />
              Payment Methods
            </CardTitle>
            <CardDescription>Manage your saved payment options</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-babyshopTextLight mx-auto mb-3" />
              <p className="text-babyshopTextLight mb-4">
                No payment methods saved
              </p>
              <p className="text-sm text-babyshopTextLight">
                Payment methods will be added during checkout
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
