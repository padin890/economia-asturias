
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'leaderboard',
    aliases: ['lb', 'top', 'ranking'],
    description: 'Muestra los usuarios con más dinero',
    usage: 'leaderboard',
    async execute(client, message, args) {
        try {
            const users = await client.economy.getLeaderboard(10);
            
            const leaderboardEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏆 Top 10 - Los Más Ricos')
                .setDescription(
                    (await Promise.all(users.map(async (user, index) => {
                        const discordUser = await client.users.fetch(user.userId).catch(() => null);
                        const total = user.wallet + user.bank;
                        const accountName = user.accountName || 'Cuenta Estándar';
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '💠';
                        return `${medal} **#${index + 1}** ${discordUser ? discordUser.username : 'Usuario'}\n╰ Cuenta: ${accountName}\n╰ Total: **${total}€**`;
                    }))).join('\n\n')
                )
                .setFooter({ text: '¡Gana más dinero para subir en el ranking!' })
                .setTimestamp();

            return message.reply({ embeds: [leaderboardEmbed] });
        } catch (error) {
            console.error('Error en comando leaderboard:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ Ha ocurrido un error al obtener la clasificación')
                ]
            });
        }
    }
};
