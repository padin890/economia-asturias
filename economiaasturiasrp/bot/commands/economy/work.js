const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'work',
    aliases: ['trabajar', 'w'],
    description: 'Trabaja para ganar dinero',
    cooldown: 3600000, // 1 hora en milisegundos
    customRoles: [], // Array que almacenará la configuración de roles personalizados
    
    subcommands: {
        addrole: {
            description: 'Añade o configura un rol personalizado',
            usage: 'work addrole <@rol/ID> <nombre> <recompensa> <días_cooldown>',
            permissions: [PermissionFlagsBits.ManageGuild]
        },
        deleterole: {
            description: 'Elimina un rol personalizado',
            usage: 'work deleterole <@rol/ID>',
            permissions: [PermissionFlagsBits.ManageGuild]
        },
        listroles: {
            description: 'Muestra la lista de roles personalizados',
            usage: 'work listroles',
            permissions: [PermissionFlagsBits.ManageGuild]
        },
        configurerole: {
            description: 'Configura un rol existente',
            usage: 'work configurerole <@rol/ID>',
            permissions: [PermissionFlagsBits.ManageGuild]
        }
    },
    
    async execute(client, message, args) {
        try {
            if (this.customRoles.length === 0) {
                const savedRoles = await client.db.getCustomRoles();
                if (savedRoles && Array.isArray(savedRoles)) {
                    this.customRoles = savedRoles;
                }
            }
        
            if (args.length > 0) {
                const subcommand = args[0].toLowerCase();
                
                switch (subcommand) {
                    case 'addrole':
                        return this.handleAddRole(client, message, args.slice(1));
                    case 'deleterole':
                        return this.handleDeleteRole(client, message, args.slice(1));
                    case 'listroles':
                        return this.handleListRoles(client, message);
                    case 'configurerole':
                        return this.handleConfigureRole(client, message, args.slice(1));
                    default:
                        break;
                }
            }
            
            const userId = message.author.id;
            const lastWork = await client.db.getLastWork(userId);
            const now = Date.now();

            if (lastWork && now - lastWork < this.cooldown) {
                const timeLeft = this.cooldown - (now - lastWork);
                const minutes = Math.ceil(timeLeft / 60000);

                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.embedColors.error)
                            .setDescription(`⏰ Debes esperar ${minutes} minutos antes de volver a trabajar.`)
                    ]
                });
            }

            const min = client.config.economy?.workMinReward || 100;
            const max = client.config.economy?.workMaxReward || 500;
            const earning = Math.floor(Math.random() * (max - min + 1)) + min;
            const message_text = "Has trabajado duro y has ganado";

            await client.economy.addWalletBalance(userId, earning);
            await client.db.setLastWork(userId, now);

            const workEmbed = new EmbedBuilder()
                .setColor(client.config.embedColors.success)
                .setTitle('💼 ¡Has trabajado!')
                .setDescription(`${message_text} **${earning}€**!`)
                .addFields(
                    { name: '💰 Ganancia', value: `${earning}€`, inline: true },
                    { name: '⏰ Próximo trabajo', value: 'Disponible en 1 hora', inline: true }
                )
                .setFooter({
                    text: message.author.tag,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            if (Math.random() < 0.1) {
                const bonus = Math.floor(earning * 0.5);
                await client.economy.addWalletBalance(userId, bonus);
                workEmbed.addFields({
                    name: '🌟 ¡BONUS!',
                    value: `Has recibido un bonus de ${bonus}€ por tu excelente trabajo!`,
                    inline: false
                });
            }

            if (this.customRoles.length > 0) {
                try {
                    const member = message.guild.members.cache.get(userId);
                    if (member) {
                        for (const roleConfig of this.customRoles) {
                            if (member.roles.cache.has(roleConfig.roleId)) {
                                const lastRoleReward = await client.db.getLastRoleReward(userId, roleConfig.roleId);
                                const rewardCooldown = roleConfig.rewardDays * 86400000;
                                
                                if (!lastRoleReward || now - lastRoleReward >= rewardCooldown) {
                                    await client.economy.addBankBalance(userId, roleConfig.rewardAmount);
                                    await client.db.setLastRoleReward(userId, now, roleConfig.roleId);
                                    
                                    workEmbed.addFields({
                                        name: `💎 ¡RECOMPENSA DE ROL ${roleConfig.name.toUpperCase()}!`,
                                        value: `Se han depositado **${roleConfig.rewardAmount}€** en tu cuenta bancaria por ser miembro ${roleConfig.name}.`,
                                        inline: false
                                    });
                                } else {
                                    const timeLeft = rewardCooldown - (now - lastRoleReward);
                                    const days = Math.ceil(timeLeft / 86400000);
                                    
                                    workEmbed.addFields({
                                        name: `💎 ROL ${roleConfig.name.toUpperCase()}`,
                                        value: `Próxima recompensa por rol ${roleConfig.name} disponible en ${days} día(s).`,
                                        inline: false
                                    });
                                }
                            }
                        }
                    }
                } catch (roleError) {
                    console.error('Error al procesar la recompensa del rol:', roleError);
                }
            }

            await message.reply({ embeds: [workEmbed] });

            try {
                if (typeof client.db.updateUserStats === 'function') {
                    await client.db.updateUserStats(userId, {
                        totalWorked: earning,
                        workCount: 1
                    });
                }
            } catch (statsError) {
                console.error('Error al actualizar estadísticas:', statsError);
            }

        } catch (error) {
            console.error('Error en comando work:', error);
            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription(`❌ Ha ocurrido un error al procesar el trabajo: ${error.message}`)
                ]
            });
        }
    },
    
    async handleAddRole(client, message, args) {
        if (!message.member.permissions.has(this.subcommands.addrole.permissions)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ No tienes permisos para configurar roles personalizados.')
                ]
            });
        }
        
        if (args.length < 4) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription(`❌ Uso incorrecto. Ejemplo: \`${this.subcommands.addrole.usage}\``)
                ]
            });
        }
        
        let roleId = args[0];
        if (roleId.startsWith('<@&') && roleId.endsWith('>')) {
            roleId = roleId.slice(3, -1);
        }
        
        const roleName = args[1];
        const rewardAmount = parseInt(args[2]);
        const rewardDays = parseInt(args[3]);
        
        if (isNaN(rewardAmount) || rewardAmount <= 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ La recompensa debe ser un número positivo.')
                ]
            });
        }
        
        if (isNaN(rewardDays) || rewardDays <= 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ Los días de cooldown deben ser un número positivo.')
                ]
            });
        }
        
        const role = message.guild.roles.cache.get(roleId);
        if (!role) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ El rol especificado no existe en este servidor.')
                ]
            });
        }
        
        const existingRoleIndex = this.customRoles.findIndex(r => r.roleId === roleId);
        
        if (existingRoleIndex !== -1) {
            this.customRoles[existingRoleIndex] = { roleId, name: roleName, rewardAmount, rewardDays };
        } else {
            this.customRoles.push({ roleId, name: roleName, rewardAmount, rewardDays });
        }
        
        await client.db.saveCustomRoles(this.customRoles);
        
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.config.embedColors.success)
                    .setTitle('✅ Rol personalizado configurado')
                    .setDescription(`El rol ${role.name} ha sido configurado correctamente.`)
                    .addFields(
                        { name: 'Nombre para mostrar', value: roleName, inline: true },
                        { name: 'Recompensa', value: `${rewardAmount}€`, inline: true },
                        { name: 'Cooldown', value: `${rewardDays} día(s)`, inline: true }
                    )
            ]
        });
    },
    
    async handleDeleteRole(client, message, args) {
        if (!message.member.permissions.has(this.subcommands.deleterole.permissions)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ No tienes permisos para eliminar roles personalizados.')
                ]
            });
        }
        
        if (args.length < 1) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription(`❌ Uso incorrecto. Ejemplo: \`${this.subcommands.deleterole.usage}\``)
                ]
            });
        }
        
        let roleId = args[0];
        if (roleId.startsWith('<@&') && roleId.endsWith('>')) {
            roleId = roleId.slice(3, -1);
        }
        
        const existingRoleIndex = this.customRoles.findIndex(r => r.roleId === roleId);
        
        if (existingRoleIndex === -1) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ El rol especificado no está configurado como personalizado.')
                ]
            });
        }
        
        const roleName = this.customRoles[existingRoleIndex].name;
        this.customRoles.splice(existingRoleIndex, 1);
        await client.db.saveCustomRoles(this.customRoles);
        
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.config.embedColors.success)
                    .setDescription(`✅ El rol personalizado "${roleName}" ha sido eliminado correctamente.`)
            ]
        });
    },
    
    async handleListRoles(client, message) {
        if (!message.member.permissions.has(this.subcommands.listroles.permissions)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ No tienes permisos para ver roles personalizados.')
                ]
            });
        }
        
        if (this.customRoles.length === 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.warning)
                        .setDescription('⚠️ No hay roles personalizados configurados.')
                ]
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor(client.config.embedColors.primary)
            .setTitle('📋 Roles Personalizados Configurados')
            .setDescription('Estos son los roles personalizados configurados para el servidor:');
        
        for (const roleConfig of this.customRoles) {
            const role = message.guild.roles.cache.get(roleConfig.roleId);
            const roleName = role ? role.name : 'Rol desconocido';
            
            embed.addFields({
                name: `${roleName} (${roleConfig.name})`,
                value: `• Recompensa: ${roleConfig.rewardAmount}€\n• Cooldown: ${roleConfig.rewardDays} día(s)\n• ID: ${roleConfig.roleId}`,
                inline: true
            });
        }
        
        return message.reply({ embeds: [embed] });
    },
    
    async handleConfigureRole(client, message, args) {
        if (!message.member.permissions.has(this.subcommands.configurerole.permissions)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ No tienes permisos para configurar roles personalizados.')
                ]
            });
        }
        
        if (args.length < 1) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription(`❌ Uso incorrecto. Ejemplo: \`${this.subcommands.configurerole.usage}\``)
                ]
            });
        }
        
        let roleId = args[0];
        if (roleId.startsWith('<@&') && roleId.endsWith('>')) {
            roleId = roleId.slice(3, -1);
        }
        
        const role = message.guild.roles.cache.get(roleId);
        if (!role) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.embedColors.error)
                        .setDescription('❌ El rol especificado no existe en este servidor.')
                ]
            });
        }
        
        const existingRole = this.customRoles.find(r => r.roleId === roleId);
        
        const embed = new EmbedBuilder()
            .setColor(client.config.embedColors.primary)
            .setTitle('⚙️ Configuración de Rol Personalizado')
            .setDescription(`Configurando rol: ${role.name}`);
        
        if (existingRole) {
            embed.addFields(
                { name: 'Nombre actual', value: existingRole.name, inline: true },
                { name: 'Recompensa actual', value: `${existingRole.rewardAmount}€`, inline: true },
                { name: 'Cooldown actual', value: `${existingRole.rewardDays} día(s)`, inline: true }
            );
        }
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('role_name')
                    .setLabel('Cambiar Nombre')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('role_reward')
                    .setLabel('Cambiar Recompensa')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('role_cooldown')
                    .setLabel('Cambiar Cooldown')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('role_save')
                    .setLabel('Guardar')
                    .setStyle(ButtonStyle.Success)
            );
        
        const configMessage = await message.reply({
            embeds: [embed],
            components: [row]
        });
        
        const filter = i => i.user.id === message.author.id;
        const collector = configMessage.createMessageComponentCollector({ filter, time: 300000 });
        
        const tempConfig = {
            roleId,
            name: existingRole ? existingRole.name : role.name,
            rewardAmount: existingRole ? existingRole.rewardAmount : 1000,
            rewardDays: existingRole ? existingRole.rewardDays : 3
        };
        
        collector.on('collect', async i => {
            if (i.isButton()) {
                if (i.customId === 'role_name') {
                    await i.reply({
                        content: 'Por favor, escribe el nuevo nombre para mostrar del rol:',
                        ephemeral: true
                    });
                    
                    const nameFilter = m => m.author.id === message.author.id;
                    const nameCollector = message.channel.createMessageCollector({ filter: nameFilter, time: 60000, max: 1 });
                    
                    nameCollector.on('collect', async m => {
                        tempConfig.name = m.content;
                        embed.spliceFields(0, 3);
                        embed.addFields(
                            { name: 'Nombre', value: tempConfig.name, inline: true },
                            { name: 'Recompensa', value: `${tempConfig.rewardAmount}€`, inline: true },
                            { name: 'Cooldown', value: `${tempConfig.rewardDays} día(s)`, inline: true }
                        );
                        await configMessage.edit({ embeds: [embed] });
                        await m.delete().catch(() => {});
                    });
                } else if (i.customId === 'role_reward') {
                    await i.reply({
                        content: 'Por favor, escribe la nueva cantidad de recompensa para el rol:',
                        ephemeral: true
                    });
                    
                    const rewardFilter = m => m.author.id === message.author.id;
                    const rewardCollector = message.channel.createMessageCollector({ filter: rewardFilter, time: 60000, max: 1 });
                    
                    rewardCollector.on('collect', async m => {
                        const rewardAmount = parseInt(m.content);
                        
                        if (isNaN(rewardAmount) || rewardAmount <= 0) {
                            await i.followUp({
                                content: 'La recompensa debe ser un número positivo. Inténtalo de nuevo.',
                                ephemeral: true
                            });
                            return;
                        }
                        
                        tempConfig.rewardAmount = rewardAmount;
                        embed.spliceFields(0, 3);
                        embed.addFields(
                            { name: 'Nombre', value: tempConfig.name, inline: true },
                            { name: 'Recompensa', value: `${tempConfig.rewardAmount}€`, inline: true },
                            { name: 'Cooldown', value: `${tempConfig.rewardDays} día(s)`, inline: true }
                        );
                        await configMessage.edit({ embeds: [embed] });
                        await m.delete().catch(() => {});
                    });
                } else if (i.customId === 'role_cooldown') {
                    await i.reply({
                        content: 'Por favor, escribe el nuevo período de cooldown en días para el rol:',
                        ephemeral: true
                    });
                    
                    const cooldownFilter = m => m.author.id === message.author.id;
                    const cooldownCollector = message.channel.createMessageCollector({ filter: cooldownFilter, time: 60000, max: 1 });

                    cooldownCollector.on('collect', async m => {
                        const rewardDays = parseInt(m.content);

                        if (isNaN(rewardDays) || rewardDays <= 0) {
                            await i.followUp({
                                content: 'El cooldown debe ser un número positivo. Inténtalo de nuevo.',
                                ephemeral: true
                            });
                            return;
                        }

                        tempConfig.rewardDays = rewardDays;
                        embed.spliceFields(0, 3);
                        embed.addFields(
                            { name: 'Nombre', value: tempConfig.name, inline: true },
                            { name: 'Recompensa', value: `${tempConfig.rewardAmount}€`, inline: true },
                            { name: 'Cooldown', value: `${tempConfig.rewardDays} día(s)`, inline: true }
                        );
                        await configMessage.edit({ embeds: [embed] });
                        await m.delete().catch(() => {});
                    });
                } else if (i.customId === 'role_save') {
                    const existingRoleIndex = this.customRoles.findIndex(r => r.roleId === roleId);
                    
                    if (existingRoleIndex !== -1) {
                        this.customRoles[existingRoleIndex] = tempConfig;
                    } else {
                        this.customRoles.push(tempConfig);
                    }
                    
                    await client.db.saveCustomRoles(this.customRoles);
                    await i.update({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.config.embedColors.success)
                                .setTitle('✅ Rol personalizado guardado')
                                .setDescription(`El rol ${role.name} ha sido configurado correctamente.`)
                                .addFields(
                                    { name: 'Nombre para mostrar', value: tempConfig.name, inline: true },
                                    { name: 'Recompensa', value: `${tempConfig.rewardAmount}€`, inline: true },
                                    { name: 'Cooldown', value: `${tempConfig.rewardDays} día(s)`, inline: true }
                                )
                        ],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId('back_to_custom_roles')
                                    .setLabel('Volver')
                                    .setStyle(ButtonStyle.Secondary)
                            )
                        ]
                    });
                    collector.stop();
                }
            }
        });

        collector.on('end', () => {
            configMessage.edit({ components: [] }).catch(() => {});
        });
    }
};