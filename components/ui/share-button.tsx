"use client";

import { useState } from "react";
import { Button } from "./button";
import { Copy } from "lucide-react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      size="sm"
      className="cursor-pointer"
    >
      <Copy className="h-4 w-4" />
      {copied ? "Copied!" : "Copy Link"}
    </Button>
  );
}
