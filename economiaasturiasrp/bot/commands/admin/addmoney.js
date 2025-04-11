const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
module.exports = {
    name: 'addmoney',
    aliases: ['añadirdinero', 'givecoins', 'givemoney'],
    description: 'Añade dinero a un usuario (Solo dueño del bot)',
    usage: 'addmoney <@usuario> <cantidad> [wallet/bank]',
    async execute(client, message, args) {
        try {
            // Verificar que el usuario sea el dueño del bot
            if (message.author.id !== client.config.ownerId) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ Solo el dueño del bot puede usar este comando.')
                    ]
                });
            }
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
                            .setDescription('❌ Debes mencionar a un usuario válido.')
                    ]
                });
            }
            // Verificar que la cantidad sea un número válido
            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount <= 0) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ La cantidad debe ser un número positivo.')
                    ]
                });
            }
            // Determinar si se añade al wallet o al bank (por defecto wallet)
            const destination = args[2]?.toLowerCase() === 'bank' ? 'bank' : 'wallet';
            // Cargar datos del usuario
            const userData = await client.economy.getUser(targetUser.id);
            // Añadir el dinero
            if (destination === 'bank') {
                userData.bank += amount;
            } else {
                userData.wallet += amount;
            }
            // Guardar los cambios
            await client.economy.saveUser(userData);
            // Enviar mensaje de confirmación
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.success)
                        .setTitle('💰 Dinero Añadido')
                        .setDescription(`Has añadido **${amount}€** a ${destination === 'bank' ? 'la cuenta bancaria' : 'la billetera'} de ${targetUser}.`)
                        .addFields(
                            { name: 'Billetera', value: `${userData.wallet}€`, inline: true },
                            { name: 'Banco', value: `${userData.bank}€`, inline: true }
                        )
                        .setTimestamp()
                ]
            });
        } catch (error) {
            console.error('Error en el comando addmoney:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ Ha ocurrido un error al ejecutar el comando.')
                ]
            });
        }
    }
};