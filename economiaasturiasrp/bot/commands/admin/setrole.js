const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'setrole',
    aliases: ['configrole', 'setrol', 'configurarrol'],
    description: 'Configura roles para el sistema de niveles (Solo administradores)',
    usage: 'setrole <nivel> <@rol>',
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
                            .setDescription(`Debes especificar un nivel y un rol.\nUso correcto: ${this.usage}`)
                    ]
                });
            }

            // Verificar que el nivel sea un número válido
            const level = parseInt(args[0]);
            if (isNaN(level) || level <= 0) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ El nivel debe ser un número mayor que 0.')
                    ]
                });
            }

            // Obtener el rol mencionado
            const role = message.mentions.roles.first();
            if (!role) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ Debes mencionar un rol válido.')
                    ]
                });
            }

            // Aquí iría la lógica para guardar la configuración del rol
            // Por ejemplo, actualizar una base de datos o un archivo JSON

            // Mensaje de confirmación
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.success)
                        .setTitle('✅ Rol Configurado')
                        .setDescription(`El rol ${role} ha sido configurado para el nivel ${level}.`)
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
