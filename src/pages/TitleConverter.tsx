import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TitleConverter() {
  const [inputText, setInputText] = useState("");
  const { toast } = useToast();

  // Convert normal titles to lowercase without spacing and symbols
  const convertedText = inputText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(convertedText);
      toast({
        title: "Copied!",
        description: `${convertedText.split("\n").length} titles copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setInputText("");
  };

  const inputLineCount = inputText
    .split("\n")
    .filter((line) => line.trim().length > 0).length;
  const outputLineCount = convertedText
    .split("\n")
    .filter((line) => line.length > 0).length;

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Title Converter
          </h1>
          <p className="text-muted-foreground mt-1">
            Convert game titles to lowercase format without spaces or symbols
          </p>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          {/* Input Section */}
          <Card className="flex flex-col shadow-lg overflow-hidden">
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Original Titles</h2>
                <span className="text-sm text-muted-foreground">
                  {inputLineCount} {inputLineCount === 1 ? "title" : "titles"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Paste your game titles (one per line)
              </p>
            </div>

            <div className="flex-1 p-4 overflow-hidden">
              <Textarea
                placeholder="Apollo Petite Roulette&#10;Sweet Bonanza&#10;Gates of Olympus&#10;..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="h-full resize-none bg-muted/10 border-border font-mono text-sm scrollbar-thin"
              />
            </div>

            <div className="p-4 border-t bg-background">
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={!inputText}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear Input
              </Button>
            </div>
          </Card>

          {/* Output Section */}
          <Card className="flex flex-col shadow-lg overflow-hidden">
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Converted Titles</h2>
                <span className="text-sm text-muted-foreground">
                  {outputLineCount} {outputLineCount === 1 ? "title" : "titles"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lowercase, no spaces, no symbols
              </p>
            </div>

            <div className="flex-1 p-4 overflow-hidden">
              <Textarea
                value={convertedText}
                readOnly
                placeholder="Converted titles will appear here..."
                className="h-full resize-none bg-muted/10 border-border font-mono text-sm cursor-default scrollbar-thin"
              />
            </div>

            <div className="p-4 border-t bg-background">
              <Button
                onClick={handleCopy}
                disabled={!convertedText}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="mt-6 p-4 bg-muted/30 border-muted">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">How it works</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This tool converts game titles to a compact format by:
                <br />
                • Converting all text to lowercase
                <br />
                • Removing all spaces
                <br />
                • Removing all symbols and punctuation
                <br />• Keeping only letters (a-z) and numbers (0-9)
              </p>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Example:</strong> "Apollo Petite Roulette" → "apollopetiteroulette"
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
