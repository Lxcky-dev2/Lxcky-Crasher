'use strict'

const { SlashCommandBuilder } = require('discord.js')
const { panels } = require('../ui/panels')
const { defer, edit } = require('../ui/respond')
const { UserError } = require('../utils/errors')

const data = new SlashCommandBuilder()
  .setName('whitelist')
  .setDescription('Protect a Realm from bot operations')
  .addSubcommand(sub => sub
    .setName('add')
    .setDescription('Whitelist a Realm by ID or invite code')
    .addStringOption(option => option
      .setName('realm')
      .setDescription('Realm ID or invite code')
      .setRequired(true)))
  .addSubcommand(sub => sub
    .setName('remove')
    .setDescription('Remove a Realm from the whitelist')
    .addStringOption(option => option
      .setName('realm')
      .setDescription('Realm ID or invite code')
      .setRequired(true)))

function isAdmin(interaction, config) {
  return Array.isArray(config.admins) && config.admins.includes(interaction.user.id)
}

async function execute(interaction, { config, whitelist }) {
  await defer(interaction, true)

  if (!isAdmin(interaction, config)) {
    return edit(interaction, panels.error('Permission denied', 'You are not configured as a whitelist admin.'))
  }

  const action = interaction.options.getSubcommand()
  const input = interaction.options.getString('realm', true).trim()

  try {
    const changed = action === 'add'
      ? whitelist.add(input)
      : whitelist.remove(input)

    return edit(interaction, action === 'add'
      ? panels.whitelistAdded(input, changed)
      : panels.whitelistRemoved(input, changed))
  } catch (error) {
    const failure = error instanceof UserError
      ? error
      : new UserError('Whitelist failed', 'The Realm whitelist could not be updated.')
    return edit(interaction, panels.error(failure.title, failure.message))
  }
}

module.exports = { data, execute }
