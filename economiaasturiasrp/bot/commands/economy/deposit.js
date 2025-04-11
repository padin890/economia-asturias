
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'deposit',
    aliases: ['dep', 'depositar'],
    description: 'Deposita dinero en tu cuenta bancaria',
    usage: 'deposit <cantidad/all>',
    async execute(client, message, args) {
        try {
            if (!args[0]) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ Debes especificar una cantidad para depositar')
                    ]
                });
            }

            const userData = await client.economy.getUser(message.author.id);
            let amount;

            if (args[0].toLowerCase() === 'all') {
                amount = userData.wallet;
            } else {
                amount = parseInt(args[0]);
                if (isNaN(amount) || amount <= 0) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.config.embedColors.error)
                                .setDescription('❌ La cantidad debe ser un número positivo')
                        ]
                    });
                }
            }

            if (amount > userData.wallet) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ No tienes suficiente dinero en tu billetera')
                    ]
                });
            }

            userData.wallet -= amount;
            userData.bank += amount;
            await client.economy.saveUser(userData);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.success)
                        .setTitle('💰 Depósito Exitoso')
                        .setDescription(`Has depositado **${amount}€** en tu cuenta bancaria`)
                        .addFields(
                            { name: 'Billetera', value: `${userData.wallet}€`, inline: true },
                            { name: 'Banco', value: `${userData.bank}€`, inline: true }
                        )
                ]
            });
        } catch (error) {
            console.error('Error en comando deposit:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ Ha ocurrido un error al procesar el depósito')
                ]
            });
        }
    }
};
