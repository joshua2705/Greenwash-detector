
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft, Home, BarChart, Settings } from "lucide-react";

const sidebarLinks = [
  { 
    name: "Overview", 
    icon: Home, 
    path: "/" 
  },
  { 
    name: "Reports", 
    icon: BarChart, 
    path: "/results" 
  },
  { 
    name: "Settings", 
    icon: Settings, 
    path: "#" 
  }
];

const Sidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        size="icon" 
        className="fixed left-4 top-4 z-40 md:hidden"
        onClick={() => setOpen(true)}
      >
        <PanelLeft className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
          <span></span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 border-r bg-white p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-green-700">Menu</h2>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {sidebarLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.path} 
                      className="flex items-center p-2 rounded-md text-gray-700 hover:bg-green-50 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <link.icon className="h-5 w-5 mr-3 text-green-600" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden md:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-green-100 bg-white">
        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarLinks.map((link) => (
              <li key={link.name}>
                <Link 
                  to={link.path} 
                  className="flex items-center p-2 rounded-md text-gray-700 hover:bg-green-50 transition-colors"
                >
                  <link.icon className="h-5 w-5 mr-3 text-green-600" />
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
