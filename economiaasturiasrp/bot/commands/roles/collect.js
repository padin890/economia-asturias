
const { EmbedBuilder } = require('discord.js');
const roles = require('../../data/roles.json');

module.exports = {
    name: 'collect',
    aliases: ['cobrar', 'recompensa'],
    description: 'Cobra los beneficios de tus roles',
    async execute(client, message, args) {
        try {
            const userData = await client.economy.getUser(message.author.id);
            if (!userData.roles || userData.roles.length === 0) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ No tienes roles que puedan cobrar beneficios.')
                    ]
                });
            }

            let totalCollected = 0;
            const now = Date.now();
            const updatedRoles = [];

            for (const userRole of userData.roles) {
                const roleData = roles.roles.find(r => r.id === userRole.id);
                if (!roleData) continue;

                const timeSinceLastCollection = now - userRole.lastCollection;
                if (timeSinceLastCollection >= roleData.collectionTime) {
                    totalCollected += roleData.collectionAmount;
                    updatedRoles.push({
                        id: userRole.id,
                        lastCollection: now
                    });
                } else {
                    updatedRoles.push(userRole);
                }
            }

            if (totalCollected > 0) {
                userData.bank += totalCollected;
                userData.roles = updatedRoles;
                await client.economy.saveUser(userData);

                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.success)
                            .setTitle('💰 Beneficios Cobrados')
                            .setDescription(`Has cobrado ${totalCollected}€ de tus roles`)
                    ]
                });
            } else {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.warning)
                            .setDescription('⏳ Aún no puedes cobrar beneficios de tus roles.')
                    ]
                });
            }

        } catch (error) {
            console.error('Error en comando collect:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ Ha ocurrido un error al cobrar los beneficios.')
                ]
            });
        }
    }
};
