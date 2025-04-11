const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'balance',
    aliases: ['bal', 'money', 'dinero', 'banco'],
    description: 'Muestra el balance de un usuario con sistema de deudas',
    usage: 'balance [@usuario]',
    async execute(client, message, args) {
        try {
            const target = message.mentions.users.first() || message.author;
            
            // Obtener datos del usuario con estructura segura
            const userData = await client.economy.getUser(target.id) || { 
                wallet: 0, 
                bank: 0,
                bankName: null,
                accountName: null,
                creditLimit: 0,
                debtSince: null
            };

            // Función para formatear cantidades
            const formatMoney = (amount) => {
                const absAmount = Math.abs(amount);
                return `${amount >= 0 ? '+' : '-'}${absAmount.toLocaleString('es-ES')}€`;
            };

            // Estilos según el saldo
            const getMoneyStyle = (amount) => {
                if (amount > 0) return { color: '#00ff00', emoji: '💵' };
                if (amount < 0) return { color: '#ff0000', emoji: '💣' };
                return { color: '#ffffff', emoji: '💰' };
            };

            // Calcular valores importantes
            const total = (userData.wallet || 0) + (userData.bank || 0);
            const walletStyle = getMoneyStyle(userData.wallet || 0);
            const bankStyle = getMoneyStyle(userData.bank || 0);
            const totalStyle = getMoneyStyle(total);

            // Crear el embed principal
            const embed = new EmbedBuilder()
                .setColor(totalStyle.color)
                .setTitle(`${totalStyle.emoji} Balance de ${target.username}`)
                .setThumbnail(target.displayAvatarURL())
                .setTimestamp();

            // Información bancaria
            embed.addFields({
                name: '🏦 Información Bancaria',
                value: [
                    `• Banco: ${userData.bankName || 'Sin banco'}`,
                    `• Cuenta: ${userData.accountName || 'Sin cuenta'}`,
                    `• Límite de crédito: ${formatMoney(userData.creditLimit || 0)}`
                ].join('\n'),
                inline: false
            });

            // Saldos
            embed.addFields(
                {
                    name: `${walletStyle.emoji} Efectivo`,
                    value: formatMoney(userData.wallet || 0),
                    inline: true
                },
                {
                    name: `${bankStyle.emoji} Banco`,
                    value: formatMoney(userData.bank || 0),
                    inline: true
                },
                {
                    name: `${totalStyle.emoji} Total Neto`,
                    value: formatMoney(total),
                    inline: true
                }
            );

            // Manejo de deudas
            if (total < 0) {
                const debt = Math.abs(total);
                const debtDate = userData.debtSince ? new Date(userData.debtSince) : new Date();
                const daysInDebt = Math.floor((Date.now() - debtDate.getTime()) / (1000 * 60 * 60 * 24));
                const interest = this.calculateInterest(debt, daysInDebt);

                embed.setDescription([
                    `⚠️ **EN DEUDA** - Debes ${formatMoney(-total)}`,
                    `📅 ${daysInDebt} día(s) con deuda`,
                    `💸 Interés acumulado: ${formatMoney(interest)}`
                ].join('\n'));

                if (daysInDebt > 7) {
                    embed.addFields({
                        name: '❌ Gravemente endeudado',
                        value: '¡Tu crédito está en peligro! Paga tus deudas pronto.',
                        inline: false
                    });
                }
            } else if (total === 0) {
                embed.setDescription('⚖️ Tu balance está equilibrado');
            } else {
                embed.setDescription(`✅ Buen estado financiero (${formatMoney(total)})`);
            }

            return message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en comando balance:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ Error al obtener el balance')
                ]
            });
        }
    },

    // Función para calcular intereses (5% diario compuesto)
    calculateInterest: function(debt, days) {
        return Math.floor(debt * (Math.pow(1.05, Math.min(days, 30)) - 1)); // Máximo 30 días de interés
    }
};