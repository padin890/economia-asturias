
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'confiscate-vehicle',
    aliases: ['incautar-vehiculo', 'decomisar-vehiculo'],
    description: 'Incauta un vehículo de un usuario (Solo administradores)',
    usage: 'confiscate-vehicle <@usuario> <vehiculo> [razón]',
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
            if (args.length < 2) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setTitle('❌ Error de Uso')
                            .setDescription(`Debes especificar un usuario y un vehículo.\nUso correcto: ${this.usage}`)
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

            // Obtener el vehículo
            const vehicle = args[1];
            
            // Obtener la razón (opcional)
            const reason = args.slice(2).join(' ') || 'No se especificó una razón';

            // Emitir evento de vehículo incautado
            client.emit('vehicleConfiscated', targetUser.id, `${vehicle} - ${reason}`);

            // Mensaje de confirmación
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.success)
                        .setTitle('🚗 Vehículo Incautado')
                        .setDescription(`Se ha incautado el vehículo "${vehicle}" de ${targetUser}.\nRazón: ${reason}`)
                ]
            });

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
