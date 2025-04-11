
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'transfer',
    aliases: ['transferir', 'enviar', 'pay', 'pagar'],
    description: 'Transfiere dinero a otro usuario',
    usage: 'transfer <@usuario> <cantidad>',
    async execute(client, message, args) {
        try {
            // Verificar argumentos
            if (args.length < 2) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setTitle('❌ Error de Uso')
                            .setDescription(`Uso correcto: \`${client.config.prefix}${this.usage}\``)
                    ]
                });
            }

            // Obtener el usuario mencionado
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ Debes mencionar a un usuario válido')
                    ]
                });
            }

            // Verificar cantidad
            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount <= 0) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ La cantidad debe ser un número positivo')
                    ]
                });
            }

            // Verificar fondos suficientes
            const userData = await client.economy.getUser(message.author.id);
            if (userData.wallet < amount) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ No tienes suficiente dinero en tu billetera')
                    ]
                });
            }

            // Realizar transferencia
            const success = await client.economy.transfer(message.author.id, targetUser.id, amount);
            if (success) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.success)
                            .setTitle('💸 Transferencia Exitosa')
                            .setDescription(`Has transferido **${amount}€** a ${targetUser}`)
                    ]
                });
            }

        } catch (error) {
            console.error('Error en el comando transfer:', error);
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
