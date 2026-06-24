import { useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Check, Copy, Smartphone } from 'lucide-react'
import { buildWhatsAppUrl } from '@shared/utils/whatsapp'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { cn } from '@shared/utils/cn'
import { COPY } from '@shared/copy/ui.copy'
import { useTrackEvent } from '@features/analytics/hooks/useTrackEvent'
import type { NewOrder, OrderItem, OrderType } from '@core/domain/entities/Order'
import { useCart } from '../../hooks/useCart'
import { useCreateOrder } from '../../hooks/useCreateOrder'
import { loadCheckoutCache, saveCheckoutCache } from '../../utils/checkoutCache'
import type { TenantDeliveryConfig, TenantTaxConfig } from '@core/domain/entities/Tenant'

interface CheckoutModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly tenantId: string
  /** Número de WhatsApp del restaurante (formato internacional). */
  readonly whatsappPhone: string
  /** Número de SINPE Móvil del restaurante (o null si no lo configuró). */
  readonly sinpeNumber: string | null
  readonly tableId: string | null
  readonly tableLabel: string | null
  readonly accentColor: string
  readonly deliveryConfig?: TenantDeliveryConfig
  readonly taxConfig?: TenantTaxConfig
}

const LINE_WIDTH = 30

function padLine(qty: number, name: string, price: string): string {
  const left = `${qty}x ${name} `
  const dots = '.'.repeat(Math.max(3, LINE_WIDTH - left.length - price.length))
  return `${left}${dots} ${price}`
}

/** Encabezado del mensaje según el contexto del pedido (mesa vs. menú digital). */
function orderHeader(mode: OrderType, tableLabel: string | null): string {
  if (mode === 'delivery') return '🛵 *Pedido a Domicilio*'
  if (mode === 'pickup') return '🛍️ *Pedido para Recoger*'
  return tableLabel ? `🍽️ *Pedido — ${COPY.cart.forTable(tableLabel)}*` : '🍽️ *Pedido — Comer en el local*'
}

function buildOrderMessage(input: {
  mode: OrderType
  tableLabel: string | null
  deliveryAddress: string | null
  items: readonly OrderItem[]
  total: string
  currency: string
  customerName: string
  customerPhone: string
  note: string
  sinpePayment: boolean
  deliveryCost: number
  taxAmount: number
  subtotal: number
}): string {
  const divider = '──────────────────'
  const itemLines: string[] = []
  for (const i of input.items) {
    itemLines.push(padLine(i.quantity, i.dishName, formatCurrency(i.unitPrice * i.quantity, input.currency)))
    if (i.variantLabel) itemLines.push(`   ➕ ${i.variantLabel}`)
    if (i.note) itemLines.push(`   📝 ${i.note}`)
  }
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const parts = [
    orderHeader(input.mode, input.tableLabel),
    divider,
    ...itemLines,
    divider,
  ]

  if (input.taxAmount > 0) {
    parts.push(`*Subtotal: ${formatCurrency(input.subtotal, input.currency)}*`) // if taxIncluded=true subtotal includes it, we just display it. Actually let's just keep it simple.
  }

  if (input.deliveryCost > 0) parts.push(`*Costo de envío: ${formatCurrency(input.deliveryCost, input.currency)}*`)
  if (input.taxAmount > 0) parts.push(`*IVA (13%): ${formatCurrency(input.taxAmount, input.currency)}*`)

  parts.push(`*Total: ${input.total}*`)
  parts.push(`👤 ${input.customerName}`)
  if (input.customerPhone.trim()) parts.push(`📞 ${input.customerPhone.trim()}`)
  if (input.mode === 'delivery' && input.deliveryAddress?.trim()) parts.push(`📍 ${input.deliveryAddress.trim()}`)
  if (input.sinpePayment) parts.push('💸 Pago: SINPE Móvil')
  if (input.note.trim()) parts.push(`🗒️ ${input.note.trim()}`)
  parts.push(`⏰ ${time}`)
  parts.push('_Enviado desde la carta digital_')
  return parts.join('\n')
}

const DIGITAL_MODES = [
  { value: 'table', label: COPY.cart.delivery.dineIn },
  { value: 'pickup', label: COPY.cart.delivery.takeout },
  { value: 'delivery', label: COPY.cart.delivery.delivery },
] as const

export function CheckoutModal({
  isOpen,
  onClose,
  tenantId,
  whatsappPhone,
  sinpeNumber,
  tableId,
  tableLabel,
  accentColor,
  deliveryConfig,
  taxConfig,
}: CheckoutModalProps) {
  const cart = useCart()
  const createOrder = useCreateOrder()
  const { track } = useTrackEvent(tenantId)
  const [copiedSinpe, setCopiedSinpe] = useState(false)

  // Total a mostrar en la pantalla de "pedido enviado" (el carrito ya se vació).
  const [sentTotal, setSentTotal] = useState('')

  function handleCopySinpe(): void {
    if (!sinpeNumber) return
    void navigator.clipboard?.writeText(sinpeNumber).then(() => {
      setCopiedSinpe(true)
      setTimeout(() => setCopiedSinpe(false), 1800)
    })
  }

  // Pedido de mesa (QR escaneado en la mesa) vs. pedido desde el menú digital.
  const isTableOrder = tableId !== null
  const cached = useMemo(() => loadCheckoutCache(tenantId), [tenantId])

  const [mode, setMode] = useState<OrderType>(
    isTableOrder ? 'table' : (cached.mode ?? 'pickup'),
  )
  const [customerName, setCustomerName] = useState(cached.customerName ?? '')
  const [customerPhone, setCustomerPhone] = useState(cached.customerPhone ?? '')
  const [address, setAddress] = useState(cached.address ?? '')
  const [note, setNote] = useState('')
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [isSent, setIsSent] = useState(false)

  const isDelivery = !isTableOrder && mode === 'delivery'
  
  const deliveryCost = isDelivery && deliveryConfig?.enabled
    ? (deliveryConfig.freeDeliveryThreshold !== null && cart.subtotal >= deliveryConfig.freeDeliveryThreshold
        ? 0
        : deliveryConfig.cost)
    : 0

  const taxAmount = taxConfig?.enabled
    ? (taxConfig.includedInPrice ? (cart.subtotal * taxConfig.rate) / (1 + taxConfig.rate) : cart.subtotal * taxConfig.rate)
    : 0

  const total = cart.subtotal + deliveryCost + (taxConfig?.enabled && !taxConfig.includedInPrice ? taxAmount : 0)

  const totalFormatted = formatCurrency(total, cart.currency)

  async function handleConfirm(): Promise<void> {
    if (!customerName.trim()) {
      setValidationMessage(COPY.cart.nameRequired)
      return
    }
    if (isDelivery && !address.trim()) {
      setValidationMessage(COPY.cart.delivery.addressRequired)
      return
    }
    if (isDelivery && !customerPhone.trim()) {
      setValidationMessage(COPY.cart.delivery.phoneRequired)
      return
    }
    setValidationMessage(null)

    const deliveryAddress = isDelivery ? address.trim() : null

    const newOrder: NewOrder = {
      tenantId,
      tableId: isTableOrder ? tableId : null,
      tableLabel: isTableOrder ? tableLabel : null,
      type: mode,
      items: cart.state.lines.map((l) => ({
        dishId: l.dishId,
        dishName: l.dishName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        variantLabel: l.variantLabel,
        note: l.note,
      })),
      subtotal: cart.subtotal,
      deliveryCost,
      taxAmount,
      total,
      currency: cart.currency,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || null,
      deliveryAddress,
      note: note.trim() || null,
      status: isTableOrder ? 'confirmed' : 'pending',
      paymentStatus: 'pending',
    }

    const message = buildOrderMessage({
      mode,
      tableLabel: isTableOrder ? tableLabel : null,
      deliveryAddress,
      items: newOrder.items,
      total: totalFormatted,
      currency: cart.currency,
      customerName: customerName.trim(),
      customerPhone,
      note,
      sinpePayment: mode !== 'table',
      deliveryCost,
      taxAmount,
      subtotal: cart.subtotal,
    })

    // Cachea los datos del cliente para el próximo pedido.
    saveCheckoutCache(tenantId, {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      address: address.trim(),
      mode,
    })

    let orderFailed = false
    try {
      await createOrder.mutateAsync(newOrder)
      track({ type: 'order_created', tableId: isTableOrder ? tableId : null })
    } catch {
      // Si Firestore falla (p. ej. modo demo sin Firebase) el pedido igual
      // se envía por WhatsApp — el restaurante no pierde la venta.
      orderFailed = true
      setValidationMessage(null)
    }

    const shouldOpenWhatsApp = whatsappPhone && (orderFailed || (mode !== 'table' && !isTableOrder))
    if (shouldOpenWhatsApp) {
      window.open(buildWhatsAppUrl(whatsappPhone, message), '_blank', 'noopener,noreferrer')
    }

    setSentTotal(totalFormatted)
    setIsSent(true)
    cart.clear()
  }

  function handleClose(): void {
    setIsSent(false)
    setValidationMessage(null)
    onClose()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-md animate-fade-in" />
        <Dialog.Content
          className="fixed bottom-0 left-[50%] z-[1000] flex w-full max-w-md translate-x-[-50%] flex-col rounded-t-[2rem] border-t border-white/[0.08] bg-zinc-950/95 p-6 pb-8 text-neutral-100 shadow-2xl backdrop-blur-2xl animate-slide-up focus:outline-none"
        >
          {isSent ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
              >
                <Check size={28} style={{ color: accentColor }} />
              </div>
              <Dialog.Title className="text-lg font-black text-white">
                {COPY.cart.orderSent}
              </Dialog.Title>
              <p className="max-w-xs text-xs leading-relaxed text-neutral-400">
                Tu pedido fue enviado al restaurante. Te confirmarán por WhatsApp.
              </p>

              {/* Pago por SINPE Móvil — solo si el restaurante lo configuró */}
              {sinpeNumber && (
                <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
                  <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-neutral-400">
                    <Smartphone size={12} style={{ color: accentColor }} />
                    Pagá por SINPE Móvil
                  </p>
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <span className="text-2xl font-black tracking-wide text-white">{sinpeNumber}</span>
                    <button
                      type="button"
                      onClick={handleCopySinpe}
                      className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-neutral-200 transition-colors hover:bg-white/10"
                    >
                      {copiedSinpe ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {copiedSinpe ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  {sentTotal && (
                    <p className="mt-2 text-xs font-semibold text-neutral-400">
                      Monto a transferir: <span className="font-black text-white">{sentTotal}</span>
                    </p>
                  )}
                  <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
                    Hacé el SINPE a ese número y envía el comprobante por WhatsApp.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="mt-2 rounded-2xl px-6 py-3 text-sm font-black text-white transition-transform active:scale-95"
                style={{ background: accentColor }}
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-start justify-between">
                <Dialog.Title className="text-lg font-black text-white">
                  {COPY.cart.checkoutTitle}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Cerrar"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                </Dialog.Close>
              </div>

              <div className="flex flex-col gap-3">
                {/* Modo de entrega — solo para pedidos del menú digital (sin mesa). */}
                {isTableOrder ? (
                  <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-neutral-300">
                    🍽️ {tableLabel ? COPY.cart.forTable(tableLabel) : COPY.cart.delivery.dineIn}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      {COPY.cart.delivery.modeLabel}
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {DIGITAL_MODES.map((opt) => {
                        const active = mode === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setMode(opt.value)}
                            className={cn(
                              'rounded-xl border px-2 py-2.5 text-center text-[11px] font-bold transition-all',
                              active
                                ? 'text-white'
                                : 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10',
                            )}
                            style={active ? { borderColor: accentColor, background: `${accentColor}22`, color: '#fff' } : undefined}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={COPY.cart.namePlaceholder}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-white/25"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={isDelivery ? 'Tu teléfono (obligatorio)' : COPY.cart.phonePlaceholder}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-white/25"
                />
                {isDelivery && (
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={COPY.cart.delivery.addressPlaceholder}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-white/25"
                  />
                )}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={COPY.cart.notePlaceholder}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-white/25"
                />

                {validationMessage && (
                  <p className="text-xs font-semibold text-red-400">{validationMessage}</p>
                )}

                {deliveryCost > 0 && (
                  <div className="flex items-center justify-between px-4 py-1">
                    <span className="text-xs font-medium text-neutral-400">Costo de Envío</span>
                    <span className="text-sm font-bold text-white">{formatCurrency(deliveryCost, cart.currency)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex items-center justify-between px-4 py-1">
                    <span className="text-xs font-medium text-neutral-400">IVA (13%) {taxConfig?.includedInPrice && '(Incluido)'}</span>
                    <span className="text-sm font-bold text-white">{formatCurrency(taxAmount, cart.currency)}</span>
                  </div>
                )}
                <div className="mt-1 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Total
                  </span>
                  <span className="text-base font-black text-white">{totalFormatted}</span>
                </div>

                <button
                  type="button"
                  disabled={createOrder.isPending || cart.itemCount === 0}
                  onClick={() => void handleConfirm()}
                  className="w-full rounded-2xl py-3.5 text-sm font-black text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
                    boxShadow: `0 4px 18px ${accentColor}33`,
                  }}
                >
                  {createOrder.isPending ? COPY.cart.sending : COPY.cart.confirm}
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
