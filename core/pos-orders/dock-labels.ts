export interface SellDockCartLabels {
  top: string
  bot: string
  hasQty: boolean
  qty: number
}

export interface SellDockLiveLabels {
  main: string
  sub: string
  needsAttention: boolean
}

/**
 * Cart half of the sell dock — empty vs review copy.
 * @param input - Qty, formatted total, and copy strings
 * @returns Dock cart labels
 */
export function buildSellDockCartLabels(input: {
  qty: number
  formattedTotal: string
  emptyBot: string
  cartLabel: string
  reviewOne: string
  reviewMany: string
}): SellDockCartLabels {
  const hasQty = input.qty > 0
  if (!hasQty) {
    return {
      top: input.cartLabel,
      bot: input.emptyBot,
      hasQty: false,
      qty: 0
    }
  }
  return {
    top: input.formattedTotal,
    bot:
      input.qty === 1
        ? input.reviewOne
        : input.reviewMany.replace("{count}", String(input.qty)),
    hasQty: true,
    qty: input.qty
  }
}

/**
 * Live half of the sell dock — calm vs needs-attention copy.
 * @param input - Live/need counts and copy strings
 * @returns Dock live labels
 */
export function buildSellDockLiveLabels(input: {
  liveCount: number
  needCount: number
  liveMain: string
  needSub: string
  calmSub: string
}): SellDockLiveLabels {
  const needsAttention = input.needCount > 0
  return {
    main: input.liveMain.replace("{count}", String(input.liveCount)),
    sub: needsAttention
      ? input.needSub.replace("{count}", String(input.needCount))
      : input.calmSub,
    needsAttention
  }
}
