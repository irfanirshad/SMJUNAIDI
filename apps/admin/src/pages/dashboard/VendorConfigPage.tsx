import { useState } from "react";
import { Settings, Store } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VendorConfigList from "@/components/vendor-config/VendorConfigList";
import VendorConfiguration from "@/components/vendor-config/VendorConfiguration";

const VendorConfigPage = () => {
  const [activeTab, setActiveTab] = useState("vendors");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vendor Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all vendor setups and system configuration settings.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Store size={16} />
            <span>Vendors</span>
          </TabsTrigger>
          <TabsTrigger
            value="configuration"
            className="flex items-center gap-2"
          >
            <Settings size={16} />
            <span>Configuration</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="mt-6">
          <VendorConfigList />
        </TabsContent>

        <TabsContent value="configuration" className="mt-6">
          <VendorConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorConfigPage;
