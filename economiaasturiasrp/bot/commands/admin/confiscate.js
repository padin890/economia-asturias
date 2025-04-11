const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'confiscate',
    aliases: ['confiscar', 'decomisar', 'seizure'],
    description: 'Confisca todos los bienes de un usuario (Solo administradores)',
    usage: 'confiscate <@usuario> [razón]',
    async execute(client, message, args) {
        try {
            // Verificar permisos de administrador
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ No tienes permisos para usar este comando.')
                    ]
                });
            }

            // Verificar argumentos
            if (!args[0]) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setTitle('❌ Error de Uso')
                            .setDescription('no funciona sorry')
                    ]
                });
            }

            // Aquí continuaría el resto de la lógica del comando...

        } catch (error) {
            console.error(error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ Ocurrió un error al ejecutar el comando.')
                ]
            });
        }
    }
};
