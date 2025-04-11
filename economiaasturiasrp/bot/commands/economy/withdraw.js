const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'withdraw',
    aliases: ['retirar', 'sacar', 'wd'],
    description: 'Retira dinero del banco a tu cartera',
    usage: 'withdraw <cantidad/all>',
    async execute(client, message, args) {
        try {
            // Verificar argumentos
            if (!args[0]) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setTitle('❌ Error de Uso')
                            .setDescription(`Uso correcto: \`${client.config.prefix}${this.usage}\``)
                    ]
                });
            }

            const userData = await client.economy.getUser(message.author.id);
            let amount;

            if (args[0].toLowerCase() === 'all') {
                amount = userData.bank;
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

            if (amount > userData.bank) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ No tienes suficiente dinero en el banco')
                    ]
                });
            }

            // Realizar la transacción
            userData.bank -= amount;
            userData.wallet += amount;
            await client.economy.saveUser(userData);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.success)
                        .setTitle('💰 Retiro Exitoso')
                        .setDescription(`Has retirado **${amount}€** de tu cuenta bancaria`)
                        .addFields(
                            { name: 'Billetera', value: `${userData.wallet}€`, inline: true },
                            { name: 'Banco', value: `${userData.bank}€`, inline: true }
                        )
                        .setTimestamp()
                ]
            });

        } catch (error) {
            console.error('Error en comando withdraw:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ Ha ocurrido un error al ejecutar el comando')
                ]
            });
        }
    }
};