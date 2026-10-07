'use strict'

const { SlashCommandBuilder } = require('discord.js')
const { panels } = require('../ui/panels')
const { defer, edit } = require('../ui/respond')
const { connectRealm } = require('../core/connector')
const { UserError } = require('../utils/errors')
const log = require('../utils/logger')

const data = new SlashCommandBuilder()
  .setName('players')
  .setDescription('List players on a realm')
  .addStringOption(option => option
    .setName('code')
    .setDescription('Realm invite code')
    .setRequired(true))

async function execute(interaction, { config, accounts, sessions, whitelist }) {
  const userId = interaction.user.id
  const input = interaction.options.getString('code', true).trim()

  await defer(interaction, config.ephemeral)

  if (whitelist?.isWhitelisted(input)) return edit(interaction, panels.realmWhitelisted())

  if (!accounts.has(userId)) return edit(interaction, panels.needsAccount())
  if (sessions.get(userId)) return edit(interaction, panels.error('Already running', 'Stop your current Realm operation first.'))
  if (sessions.size >= config.maxSessions) return edit(interaction, panels.atCapacity())
  if (!sessions.claim(userId)) return edit(interaction, panels.error('Operation in progress', 'A Realm operation is already running.'))

  let session = null

  try {
    await edit(interaction, panels.playersOperation(input, 'Connecting', 'Connecting to the Realm to retrieve its players'))

    session = await connectRealm({ userId, input, accounts, config, whitelist })
    session.interaction = interaction
    sessions.add(userId, session)
    //not how these bots usally fetch players but my protocol was built for a normal minecraft realm bot and cba to change 
    const players = session.realm.players?.list?.() ?? []

    await sessions.end(userId, 'Players retrieved')
    sessions.release(userId)

    await edit(interaction, panels.playersCompleted(session.info.id, players))
  } catch (error) {
    if (session) await sessions.end(userId, 'Players retrieval failed').catch(() => {})
    sessions.release(userId)

    const reason = error instanceof UserError
      ? error.message
      : (error?.message || 'The Realm players could not be retrieved.')

    if (!(error instanceof UserError)) log.error('Players command failed', error)

    if (reason === 'Operations are disabled on this Realm because it has been added to the whitelist.') {
      await edit(interaction, panels.realmWhitelisted())
    } else {
      await edit(interaction, session
        ? panels.playersFailed(session.info.id, reason)
        : panels.error('Players Operation', reason))
    }
  }
}

module.exports = { data, execute }