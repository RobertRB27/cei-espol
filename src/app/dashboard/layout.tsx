'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  LayoutGrid,
  FilePlus2,
  FileCheck,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Menu configuration based on user role
const menuConfig = {
  // Regular user (role_id = 1)
  '1': [
    { 
      icon: <LayoutGrid className="h-5 w-5" />, 
      label: 'Dashboard', 
      href: '/dashboard' 
    },
    { 
      icon: <FileText className="h-5 w-5" />, 
      label: 'Projects', 
      href: '/dashboard/projects' 
    },
    { 
      icon: <FilePlus2 className="h-5 w-5" />, 
      label: 'Applications', 
      href: '/dashboard/applications' 
    },
    { 
      icon: <FileCheck className="h-5 w-5" />, 
      label: 'Authorizations', 
      href: '/dashboard/authorizations' 
    },
    { 
      icon: <Bell className="h-5 w-5" />, 
      label: 'Updates', 
      href: '/dashboard/updates' 
    },
  ],
  // Manager (role_id = 2)
  '2': [
    { 
      icon: <LayoutGrid className="h-5 w-5" />, 
      label: 'Dashboard', 
      href: '/dashboard' 
    },
    { 
      icon: <FileCheck className="h-5 w-5" />, 
      label: 'Manage Applications', 
      href: '/dashboard/manage' 
    },
  ],
  // Reviewer (role_id = 3)
  '3': [
    { 
      icon: <LayoutGrid className="h-5 w-5" />, 
      label: 'Dashboard', 
      href: '/dashboard' 
    },
    { 
      icon: <FileCheck className="h-5 w-5" />, 
      label: 'Review Applications', 
      href: '/dashboard/review' 
    },
  ],
  // Default menu items for all other roles
  'default': [
    { 
      icon: <LayoutGrid className="h-5 w-5" />, 
      label: 'Dashboard', 
      href: '/dashboard' 
    },
  ]
};

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRoleId = session?.user?.role_id?.toString() || 'default';
  
  // Get appropriate menu items based on user role
  const menuItems = menuConfig[userRoleId as keyof typeof menuConfig] || menuConfig.default;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/sign-in' });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} 
                    bg-white shadow-md transition-all duration-300 
                    flex flex-col fixed h-full z-10`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className={`flex items-center ${sidebarOpen ? 'justify-between w-full' : 'justify-center'}`}>
            {sidebarOpen && <h1 className="text-xl font-bold">CEI-ESPOL</h1>}
            <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto pt-5 px-3">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link 
                  href={item.href}
                  className={`flex items-center p-3 rounded-md 
                              ${pathname === item.href 
                                ? 'bg-gray-100 text-blue-600' 
                                : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <div className="mr-3">{item.icon}</div>
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="min-w-[36px] h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={20} />
            </div>
            
            {sidebarOpen && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between w-full text-left">
                    <div className="truncate">
                      <div className="font-medium">{session?.user?.name || 'User'}</div>
                      <div className="text-xs text-gray-500 truncate">{session?.user?.email}</div>
                    </div>
                    <ChevronDown size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {!sidebarOpen && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut} 
                className="rounded-full"
              >
                <LogOut size={20} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div 
        className={`flex-1 transition-all duration-300 
                    ${sidebarOpen ? 'ml-64' : 'ml-20'}`}
      >
        <main className="p-6 h-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
