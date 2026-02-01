'use client'

import * as React from 'react'
import { useState } from 'react'
import { Save, X, Eye, FileText, Settings, Type, Variable } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { Contract, ContractVariable } from '@/store/contract-store'

interface ContractEditorProps {
  contract: Contract
  onSave: (updates: Partial<Contract>) => void
  onCancel: () => void
}

export function ContractEditor({ contract, onSave, onCancel }: ContractEditorProps) {
  const [title, setTitle] = useState(contract.title)
  const [content, setContent] = useState(contract.content)
  const [variables, setVariables] = useState(contract.variables)
  const [previewMode, setPreviewMode] = useState(false)

  const handleSave = () => {
    onSave({
      title,
      content,
      variables,
    })
  }

  const renderPreview = () => {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match
    })
  }

  const detectVariables = (): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g)
    if (!matches) return []
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
  }

  const detectedVars = detectVariables()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Edit Contract</h2>
            <p className="text-sm text-slate-600">{contract.templateName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={previewMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="content" className="h-full flex flex-col">
          <div className="border-b border-slate-200 px-4">
            <TabsList>
              <TabsTrigger value="content">
                <Type className="w-4 h-4 mr-2" />
                Content
              </TabsTrigger>
              <TabsTrigger value="variables">
                <Variable className="w-4 h-4 mr-2" />
                Variables ({detectedVars.length})
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="content" className="flex-1 m-0 p-4">
            <ScrollArea className="h-full">
              {previewMode ? (
                <div className="max-w-3xl mx-auto bg-white shadow-lg p-12">
                  <div className="prose prose-slate max-w-none">
                    <div className="whitespace-pre-wrap font-serif text-slate-900 leading-relaxed">
                      {renderPreview()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl">
                  <div className="space-y-2">
                    <Label htmlFor="title">Contract Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contract title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Contract Content</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={30}
                      className="font-mono text-sm"
                      placeholder="Enter contract content. Use {{variableName}} for variables."
                    />
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="variables" className="flex-1 m-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-4 max-w-2xl">
                {detectedVars.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Variable className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No variables detected in contract content</p>
                    <p className="text-sm mt-2">
                      Use double curly braces to create variables: {`{{variableName}}`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline">{detectedVars.length} variables found</Badge>
                      <p className="text-sm text-slate-600">
                        Set default values for contract variables
                      </p>
                    </div>
                    {detectedVars.map((varName) => (
                      <div key={varName} className="space-y-2">
                        <Label htmlFor={`var-${varName}`}>
                          {varName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Label>
                        <Input
                          id={`var-${varName}`}
                          value={variables[varName] || ''}
                          onChange={(e) =>
                            setVariables({ ...variables, [varName]: e.target.value })
                          }
                          placeholder={`Enter ${varName}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 m-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Contract Metadata</h3>

                  <div className="space-y-2">
                    <Label htmlFor="effectiveDate">Effective Date</Label>
                    <Input
                      id="effectiveDate"
                      type="date"
                      value={contract.metadata.effectiveDate || ''}
                      readOnly
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-slate-700">Party 1</h4>
                      <div className="space-y-2">
                        <Label htmlFor="party1Name">Name</Label>
                        <Input
                          id="party1Name"
                          value={contract.metadata.party1.name}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="party1Email">Email</Label>
                        <Input
                          id="party1Email"
                          type="email"
                          value={contract.metadata.party1.email}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="party1Company">Company</Label>
                        <Input
                          id="party1Company"
                          value={contract.metadata.party1.company || ''}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-slate-700">Party 2</h4>
                      <div className="space-y-2">
                        <Label htmlFor="party2Name">Name</Label>
                        <Input
                          id="party2Name"
                          value={contract.metadata.party2.name}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="party2Email">Email</Label>
                        <Input
                          id="party2Email"
                          type="email"
                          value={contract.metadata.party2.email}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="party2Company">Company</Label>
                        <Input
                          id="party2Company"
                          value={contract.metadata.party2.company || ''}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={contract.metadata.notes || ''}
                      readOnly
                      rows={4}
                      placeholder="Internal notes about this contract"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
