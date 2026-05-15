import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings, User } from 'lucide-react';


export function ProfileMenu() {
  
  const { auth } = usePage().props as any;
  const user = auth?.user;
  // Get avatar URL
  const getAvatarUrl = () => {
    // Show uploaded avatar from database
    if (auth?.user?.avatar) {
      return window.storage(auth.user.avatar);
    }
    // Show default avatar
    return window.asset('images/avatar/avatar.png');
  };

  const handleLogout = () => {
    router.post(route('logout'));
  };

  const initials = user?.name
    ? user.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative flex items-center gap-3 h-10 pl-1.5 pr-1.5 py-1.5 rounded-xl border border-transparent transition-none hover:bg-transparent hover:text-inherit"
        >
          <div className="relative group/avatar">
            <Avatar className="h-9 w-9 rounded-full border border-border/50 shadow-sm">
              <AvatarImage src={getAvatarUrl()} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary text-xs font-black rounded-full">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={route('profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>{"Profile"}</span>
            </Link>
          </DropdownMenuItem>

        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{"Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}