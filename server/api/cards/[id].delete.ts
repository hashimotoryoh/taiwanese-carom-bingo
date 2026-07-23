export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await withCardLock(id, () => removeCard(id))
  await withIndexLock(async () => {
    const idx = await loadCardIndex()
    await saveCardIndex(idx.filter((c) => c.id !== id))
  })
  return { ok: true }
})
