export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const card = await loadCard(id)
  if (!card) {
    throw createError({
      statusCode: 404,
      message: '指定されたビンゴカードが見つかりませんでした。',
    })
  }
  if (!card.archived) {
    card.archived = true
    card.updatedAt = Date.now()
    await saveCard(card)
    await syncCardToIndex(card)
  }
  return card
})
