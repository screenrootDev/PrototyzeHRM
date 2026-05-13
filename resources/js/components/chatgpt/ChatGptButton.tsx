import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';


interface ChatGptButtonProps {
  onClick: () => void;
  text?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function ChatGptButton({ 
  onClick, 
  text = "Auto Generate",
  variant = "outline",
  size = "sm",
  className = ""
}: ChatGptButtonProps) {
  

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      className={`flex items-center gap-2 ${className}`}
    >
      <Brain className="h-4 w-4" />
      {text}
    </Button>
  );
}