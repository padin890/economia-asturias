const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'fine',
    aliases: ['multar', 'penalizar', 'sancion'],
    description: 'Impone una multa económica a un usuario (Solo administradores)',
    usage: 'fine <@usuario> <cantidad> [razón]',
    async execute(client, message, args) {
        try {
            // 1. Verificar permisos
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription('❌ No tienes permisos para multar usuarios.')
                    ]
                });
            }

            // 2. Validar argumentos
            if (args.length < 2 || !message.mentions.users.first()) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription(`Uso correcto: \`${this.usage}\``)
                    ]
                });
            }

            const targetUser = message.mentions.users.first();
            const amount = parseInt(args[1]);
            const reason = args.slice(2).join(' ') || 'Sin razón especificada';

            if (isNaN(amount) || amount <= 0) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription('❌ La cantidad debe ser un número positivo.')
                    ]
                });
            }

            // 3. Sistema de multas con deudas
            const userId = targetUser.id;
            
            // Obtener balance actual (asegúrate que tu economía tenga este método)
            const currentBalance = await client.economy.getBalance(userId) || 0;
            const newBalance = currentBalance - amount;

            // Actualizar el balance (puede quedar negativo)
            await client.economy.setBalance(userId, newBalance);

            // 4. Registrar la transacción
            await client.economy.addTransaction({
                userId: userId,
                type: 'FINE',
                amount: -amount,
                reason: reason,
                moderator: message.author.id,
                newBalance: newBalance
            });

            // 5. Notificar al usuario
            try {
                await targetUser.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(`💸 Multa aplicada - ${amount}€`)
                            .setDescription(`**Razón:** ${reason}`)
                            .addFields(
                                { name: 'Saldo anterior', value: `${currentBalance}€`, inline: true },
                                { name: 'Nuevo saldo', value: `${newBalance}€`, inline: true },
                                { name: 'Servidor', value: message.guild.name, inline: false }
                            )
                    ]
                });
            } catch (error) {
                console.log('No se pudo enviar DM al usuario:', error);
            }

            // 6. Confirmación en el chat
            const responseEmbed = new EmbedBuilder()
                .setColor(newBalance >= 0 ? 'Green' : 'Orange')
                .setTitle(`✅ Multa aplicada a ${targetUser.username}`)
                .setDescription(`**${amount}€** ${reason}`)
                .addFields(
                    { name: 'Saldo resultante', value: `${newBalance}€`, inline: true },
                    { name: 'Estado', value: newBalance >= 0 ? 'Positivo' : 'En deuda', inline: true }
                );

            if (newBalance < 0) {
                responseEmbed.addFields({
                    name: '⚠️ Atención',
                    value: 'El usuario ha quedado con saldo negativo',
                    inline: false
                });
            }

            return message.reply({ embeds: [responseEmbed] });

        } catch (error) {
            console.error('Error en comando fine:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ Error al procesar la multa.')
                ]
            });
        }
    }
};