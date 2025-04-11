
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'createaccount',
    aliases: ['newaccount', 'cuenta', 'crearcuenta'],
    description: 'Crea una cuenta bancaria personalizada',
    usage: 'createaccount <número_banco> <nombre_cuenta>',
    async execute(client, message, args) {
        try {
            const banks = client.db.getBanks();
            
            if (!args[0]) {
                const banksList = banks.map(bank => `${bank.id}. ${bank.name}`).join('\n');
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.info)
                            .setTitle('🏦 Bancos Disponibles')
                            .setDescription(`Selecciona un banco usando: ${client.config.prefix}createaccount <número> <nombre_cuenta>\n\n${banksList}`)
                    ]
                });
            }

            const bankId = parseInt(args[0]);
            const selectedBank = client.db.getBankById(bankId);
            
            if (!selectedBank) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ Número de banco inválido')
                    ]
                });
            }

            const accountName = args.slice(1).join(' ');
            if (!accountName) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ Debes especificar un nombre para tu cuenta')
                    ]
                });
            }

            const userData = await client.economy.getUser(message.author.id);
            userData.bank = userData.bank || 0;
            userData.accountName = accountName;
            userData.bankName = selectedBank.name;
            await client.economy.saveUser(userData);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.success)
                        .setTitle('🏦 Cuenta Bancaria Creada')
                        .addFields(
                            { name: 'Banco', value: selectedBank.name, inline: true },
                            { name: 'Nombre de Cuenta', value: accountName, inline: true },
                            { name: 'Titular', value: message.author.username, inline: true },
                            { name: 'Balance Inicial', value: `${userData.bank}€`, inline: true }
                        )
                        .setTimestamp()
                ]
            });
        } catch (error) {
            console.error('Error en comando createaccount:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ Ha ocurrido un error al crear la cuenta')
                ]
            });
        }
    }
};
