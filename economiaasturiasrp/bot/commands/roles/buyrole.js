
const { EmbedBuilder } = require('discord.js');
const roles = require('../../data/roles.json');

module.exports = {
    name: 'buyrole',
    aliases: ['comprarrol'],
    description: 'Compra un rol especial',
    usage: 'buyrole <id_rol>',
    async execute(client, message, args) {
        try {
            if (!args[0]) {
                const rolesEmbed = new EmbedBuilder()
                    .setColor(client.config.embedColors.info)
                    .setTitle('🎭 Roles Disponibles')
                    .setDescription(roles.roles.map(role => 
                        `**${role.name}** (${role.id})\n` +
                        `Precio: ${role.price}€\n` +
                        `Beneficio: ${role.collectionAmount}€ cada ${role.collectionTime/3600000} horas\n` +
                        `${role.description}\n`
                    ).join('\n'));
                
                return message.reply({ embeds: [rolesEmbed] });
            }

            const roleId = args[0].toLowerCase();
            const roleData = roles.roles.find(r => r.id === roleId);

            if (!roleData) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription('❌ Rol no encontrado.')
                    ]
                });
            }

            const userData = await client.economy.getUser(message.author.id);
            if (userData.bank < roleData.price) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription(`❌ No tienes suficiente dinero. Necesitas ${roleData.price}€`)
                    ]
                });
            }

            userData.bank -= roleData.price;
            userData.roles = userData.roles || [];
            userData.roles.push({
                id: roleData.id,
                lastCollection: Date.now()
            });

            await client.economy.saveUser(userData);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(roleData.color)
                        .setTitle('✅ Rol Comprado')
                        .setDescription(`Has comprado el rol ${roleData.name} por ${roleData.price}€`)
                ]
            });

        } catch (error) {
            console.error('Error en comando buyrole:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ Ha ocurrido un error al comprar el rol.')
                ]
            });
        }
    }
};
