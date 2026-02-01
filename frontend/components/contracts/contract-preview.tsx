'use client'

import * as React from 'react'
import { X, Download, Send, FileSignature, Printer, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { Contract } from '@/store/contract-store'

interface ContractPreviewProps {
  contract: Contract
  onClose: () => void
  onDownload: () => void
  onSend?: () => void
  onSign?: () => void
}

export function ContractPreview({
  contract,
  onClose,
  onDownload,
  onSend,
  onSign,
}: ContractPreviewProps) {
  const [zoom, setZoom] = React.useState(100)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{contract.title}</h2>
            <p className="text-sm text-slate-600">{contract.templateName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(50, zoom - 10))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600 min-w-[60px] text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(200, zoom + 10))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {onSend && contract.status === 'draft' && (
              <Button size="sm" onClick={onSend}>
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            )}
            {onSign && contract.status !== 'draft' && contract.status !== 'fully_signed' && (
              <Button size="sm" onClick={onSign}>
                <FileSignature className="w-4 h-4 mr-2" />
                Sign
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-8">
          <div
            className="max-w-3xl mx-auto bg-white shadow-lg p-12 print:p-8"
            style={{ fontSize: `${zoom}%` }}
          >
            {/* Contract Metadata */}
            <div className="mb-8 pb-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <Badge className="text-xs">
                  {contract.status.replace(/_/g, ' ').toUpperCase()}
                </Badge>
                <span className="text-sm text-slate-600">
                  Contract ID: {contract.id}
                </span>
              </div>
            </div>

            {/* Contract Content */}
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap font-serif text-slate-900 leading-relaxed">
                {contract.content}
              </div>
            </div>

            {/* Signatures Section */}
            {contract.signatures.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {contract.signatures.map((sig) => (
                    <div key={sig.id} className="space-y-2">
                      <div className="h-20 border-b-2 border-slate-900 flex items-end pb-2">
                        {sig.signedAt && sig.signatureData && (
                          <span className="text-3xl font-serif text-slate-900">
                            {sig.signatureData}
                          </span>
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">{sig.signerName}</p>
                        <p className="text-slate-600">{sig.signerRole}</p>
                        {sig.signedAt && (
                          <p className="text-slate-500 mt-1">
                            Signed on {new Date(sig.signedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500 text-center">
              <p>
                This document was generated electronically and is valid without physical signature.
              </p>
              <p className="mt-1">
                Document generated on {new Date(contract.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
