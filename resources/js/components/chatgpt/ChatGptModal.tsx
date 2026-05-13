
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Sparkles, Copy, Check, X } from 'lucide-react';

import { toast } from '@/components/custom-toast';
import { useStackedModal } from '@/hooks/useStackedModal';
import ReactCountryFlag from 'react-country-flag';
const languageData = [
  { code: 'en', name: 'English', countryCode: 'US' },
  { code: 'hi', name: 'Hindi', countryCode: 'IN' },
  { code: 'mr', name: 'Marathi', countryCode: 'IN' }
];

interface ChatGptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (content: string) => void;
  title?: string;
  placeholder?: string;
}

export function ChatGptModal({ 
  isOpen, 
  onClose, 
  onGenerate, 
  title = "AI Content Generator",
  placeholder = "Describe what you want to generate..."
}: ChatGptModalProps) {
  
  const { modalId, zIndex } = useStackedModal('chatgpt-modal', isOpen);
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [creativity, setCreativity] = useState('medium');
  const [numResults, setNumResults] = useState(1);
  const [maxLength, setMaxLength] = useState(150);
  const [selectedText, setSelectedText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(route('chatgpt.generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({ 
          prompt,
          language,
          creativity,
          num_results: numResults,
          max_length: maxLength
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setGeneratedContent(data.content);
      } else {
        toast.error(data.message || 'Failed to generate content');
      }
    } catch (error) {
      toast.error('Error connecting to AI service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUse = () => {
    if (generatedContent) {
      onGenerate(generatedContent);
      handleClose();
    }
  };

  const handleClose = () => {
    setPrompt('');
    setGeneratedContent('');
    setSelectedText('');
    setCopied(false);
    onClose();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleTextSelection = () => {
    const textarea = document.getElementById('generated-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);
      setSelectedText(selected);
    }
  };

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex }}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 pointer-events-auto border" style={{ zIndex: zIndex + 1 }}>
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{'Language'}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ zIndex: zIndex + 10 }}>
                  {languageData.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <ReactCountryFlag
                        countryCode={lang.countryCode}
                        svg
                        style={{ width: '1em', height: '1em', marginRight: '8px' }}
                      />
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{'AI Creativity'}</Label>
              <Select value={creativity} onValueChange={setCreativity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ zIndex: zIndex + 10 }}>
                  <SelectItem value="low">{"Low"} (0.3)</SelectItem>
                  <SelectItem value="medium">{"Medium"} (0.7)</SelectItem>
                  <SelectItem value="high">{"High"} (0.9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{'Number of Results'}</Label>
              <Input
                type="number"
                value={numResults}
                onChange={(e) => setNumResults(Number(e.target.value))}
                min={1}
                max={5}
              />
            </div>
            <div>
              <Label>{'Max Result Length'}</Label>
              <Input
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(Number(e.target.value))}
                min={50}
                max={500}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="prompt">{'Add Text'}</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="mt-1"
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isLoading || !prompt.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {'Generating...'}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {'Generate'}
              </>
            )}
          </Button>

          {generatedContent && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="generated">{'Output Text'}</Label>
                <div className="flex gap-2">
                  {selectedText && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(selectedText)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {'Copy Selected'}
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(generatedContent)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {'Copy Text'}
                  </Button>
                </div>
              </div>
              <Textarea
                id="generated-content"
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                onSelect={handleTextSelection}
                rows={6}
                className="mt-1"
              />
              <div className="flex gap-2 mt-2">
                <Button onClick={handleUse} className="flex-1">
                  {'Use This Content'}
                </Button>
                <Button variant="outline" onClick={handleGenerate} disabled={isLoading}>
                  {'Regenerate'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}