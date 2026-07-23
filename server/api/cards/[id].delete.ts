export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await withCardLock(id, () => removeCard(id))
  return { ok: true }
})
