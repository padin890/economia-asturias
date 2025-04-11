
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'invest',
    aliases: ['invertir', 'inversion'],
    description: 'Invierte tu dinero para obtener beneficios',
    usage: 'invest <cantidad>',
    async execute(client, message, args) {
        try {
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

            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount <= 0) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription(`❌ La cantidad debe ser un número positivo.`)
                    ]
                });
            }

            const userData = await client.economy.getUser(message.author.id);
            if (userData.wallet < amount) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription(`❌ No tienes suficiente dinero en tu billetera.`)
                    ]
                });
            }

            // Investment logic here
            userData.wallet -= amount;
            await client.economy.saveUser(userData);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.success)
                        .setTitle('💰 Inversión Realizada')
                        .setDescription(`Has invertido **${amount}€**.\nEspera 24 horas para recibir tus beneficios.`)
                ]
            });

        } catch (error) {
            console.error('Error en el comando invest:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription(`❌ Ha ocurrido un error al procesar tu inversión.`)
                ]
            });
        }
    }
};
