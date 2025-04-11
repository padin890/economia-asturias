
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'say',
    aliases: ['decir', 'echo'],
    description: 'Hace que el bot diga un mensaje',
    usage: 'say <mensaje>',
    async execute(client, message, args) {
        try {
            // Verificar si hay un mensaje para decir
            if (!args.length) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setTitle('❌ Error de Uso')
                            .setDescription('Debes proporcionar un mensaje para que yo diga.')
                    ]
                });
            }

            const texto = args.join(' ');
            await message.delete();
            
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.success)
                        .setDescription(texto)
                ]
            });

        } catch (error) {
            console.error('Error en el comando say:', error);
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
