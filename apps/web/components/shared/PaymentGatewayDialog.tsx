"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  CreditCard,
  Wallet,
  Smartphone,
  Shield,
} from "lucide-react";
import PriceFormatter from "@/components/common/PriceFormatter";

interface PaymentGatewayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: number;
  selectedGateway: "razorpay" | "cod" | null;
  onGatewaySelect: (gateway: "razorpay" | "cod") => void;
  onConfirm: (gateway: "razorpay" | "cod") => void;
  isProcessing: boolean;
}

const PaymentGatewayDialog: React.FC<PaymentGatewayDialogProps> = ({
  isOpen,
  onClose,
  orderTotal,
  selectedGateway,
  onGatewaySelect,
  onConfirm,
  isProcessing,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-20 h-20 bg-linear-to-br from-babyshopSky/20 to-babyshopSky/5 rounded-2xl flex items-center justify-center shadow-lg">
            <Wallet className="w-10 h-10 text-babyshopSky" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Select Payment Gateway
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 text-base">
            Choose your preferred payment method to complete your order
          </DialogDescription>
        </DialogHeader>

        {/* Order Total - Enhanced Design */}
        <div className="mt-2 p-5 bg-linear-to-r from-babyshopSky/10 via-babyshopSky/5 to-transparent rounded-xl border border-babyshopSky/20 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-babyshopSky/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-babyshopSky" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Order Total
              </span>
            </div>
            <span className="text-2xl font-bold text-babyshopBlack">
              <PriceFormatter amount={orderTotal} />
            </span>
          </div>
        </div>

        <div className="py-2">
          <RadioGroup
            value={selectedGateway || ""}
            onValueChange={(value) =>
              onGatewaySelect(value as "razorpay" | "cod")
            }
            className="space-y-3"
          >
            {/* Razorpay Option */}
            <div
              className={`relative group rounded-xl border-2 p-4 cursor-pointer transition-all duration-300 ${
                selectedGateway === "razorpay"
                  ? "border-babyshopSky bg-linear-to-br from-babyshopSky/10 to-babyshopSky/5 shadow-lg shadow-babyshopSky/20 scale-[1.02]"
                  : "border-gray-200 hover:border-babyshopSky/40 hover:shadow-md bg-white"
              }`}
              onClick={() => onGatewaySelect("razorpay")}
            >
              {selectedGateway === "razorpay" && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-babyshopSky rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-4 h-4 text-white fill-current" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <RadioGroupItem value="razorpay" id="razorpay" className="shrink-0" />
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor="razorpay" className="cursor-pointer block">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-semibold text-gray-900">
                        Razorpay
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 h-4"
                      >
                        Online
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 leading-tight">
                      Cards, UPI, Netbanking & Wallets
                    </p>
                  </Label>
                </div>
              </div>
            </div>

            {/* Cash on Delivery Option */}
            <div
              className={`relative group rounded-xl border-2 p-4 cursor-pointer transition-all duration-300 ${
                selectedGateway === "cod"
                  ? "border-babyshopSky bg-linear-to-br from-babyshopSky/10 to-babyshopSky/5 shadow-lg shadow-babyshopSky/20 scale-[1.02]"
                  : "border-gray-200 hover:border-babyshopSky/40 hover:shadow-md bg-white"
              }`}
              onClick={() => onGatewaySelect("cod")}
            >
              {selectedGateway === "cod" && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-babyshopSky rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-4 h-4 text-white fill-current" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <RadioGroupItem value="cod" id="cod" className="shrink-0" />
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor="cod" className="cursor-pointer block">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-semibold text-gray-900">
                        Cash on Delivery
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 h-4"
                      >
                        Pay on arrival
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 leading-tight">
                      Pay when your order is delivered
                    </p>
                  </Label>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={() => selectedGateway && onConfirm(selectedGateway)}
            disabled={isProcessing || !selectedGateway}
            size="lg"
            className="w-full bg-linear-to-r from-babyshopSky to-babyshopSky/90 hover:from-babyshopSky/90 hover:to-babyshopSky text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing Payment...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                {selectedGateway
                  ? "Continue to Secure Payment"
                  : "Select Payment Method"}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentGatewayDialog;
