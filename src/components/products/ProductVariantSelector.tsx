'use client'

import { ProductVariant } from '@/types/product'

interface ProductVariantSelectorProps {
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onSelect: (variant: ProductVariant) => void
}

export function ProductVariantSelector({ 
  variants, 
  selectedVariant, 
  onSelect 
}: ProductVariantSelectorProps) {
  // Group variants if they have similar patterns (like different amounts)
  const variantGroups = variants.reduce((groups, variant) => {
    const key = variant.variant_name.split(' ')[1] || variant.variant_name
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(variant)
    return groups
  }, {} as Record<string, ProductVariant[]>)

  return (
    <div className="space-y-4">
      {Object.entries(variantGroups).map(([groupName, groupVariants]) => (
        <div key={groupName}>
          <h4 className="text-sm font-medium text-slate-700 mb-2 capitalize">
            {groupName}:
          </h4>
          <div className="flex flex-wrap gap-2">
            {groupVariants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id
              const hasDiscount = variant.original_price && variant.original_price > variant.price

              return (
                <button
                  key={variant.id}
                  onClick={() => onSelect(variant)}
                  disabled={variant.stock_quantity === 0 && variant.stock_type === 'limited'}
                  className={`
                    relative px-4 py-3 rounded-lg border-2 transition-all min-w-[100px]
                    ${isSelected 
                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' 
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                    }
                    ${(variant.stock_quantity === 0 && variant.stock_type === 'limited') 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                    }
                  `}
                >
                  {/* Discount Badge */}
                  {hasDiscount && (
                    <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs px-2 py-1 rounded-full">
                      Save {Math.round(((variant.original_price! - variant.price) / variant.original_price!) * 100)}%
                    </div>
                  )}

                  <div className="text-center">
                    <div className="font-semibold text-slate-900">
                      {variant.variant_name}
                    </div>
                    <div className="text-sm mt-1">
                      <span className="font-bold text-indigo-700">
                        रु {variant.price.toFixed(2)}
                      </span>
                      {variant.original_price && (
                        <span className="text-slate-500 line-through ml-2 text-xs">
                          रु {variant.original_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}