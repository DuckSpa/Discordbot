const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageEmbed} = require("discord.js")
const { QueryType } = require("discord-player")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("Reproduce canciones de youtube")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("song")
				.setDescription("Reproduce una sola cancion desde un URL")
				.addStringOption((option) => option.setName("url").setDescription("URL de la cancion").setRequired(true))
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("playlist")
				.setDescription("Reproduce una lista de canciones desde un URL")
				.addStringOption((option) => option.setName("url").setDescription("URL de la lista de canciones").setRequired(true))
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("search")
				.setDescription("Busca una cancion en base a palabras claves")
				.addStringOption((option) =>
					option.setName("searchterms").setDescription("Palabras claves a buscar").setRequired(true)
				)
		),
	run: async ({ client, interaction}) => {
		if (!interaction.member.voice.channel) return interaction.editReply("Necesitas estar un chat de voz para usar este comando!")

		const queue = await client.player.createQueue(interaction.guild)
		if (!queue.connection) await queue.connect(interaction.member.voice.channel)

		let embed = new MessageEmbed()

		if (interaction.options.getSubcommand() === "song") {
            let url = interaction.options.getString("url")
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_VIDEO
            })
            
            if (result.tracks.length === 0){
                return interaction.editReply({
                    embeds: [new MessageEmbed()
                        .setDescription(`:x:Sin resultados!`)
                        .setColor('#b2a89e')
                    ]
                })
            }

            const song = result.tracks[0]
            await queue.addTrack(song)

            let bar = queue.createProgressBar({
                queue: false,
                length: 20,
            })

            const options = interaction.options._hoistedOptions;
            const user = (options.find((e) => e.name === "user") && options.find((e) => e.name === "user").member.user) || interaction.user;
            const image = user.displayAvatarURL()
            const currentSong = queue.current

            embed
                .setDescription(`**[${song.title}](${song.url})** \n añadido a la lista de reproduccion!`)
                .setThumbnail(song.thumbnail)
                .addFields(
                    { name: `:musical_note: Reproduciendo: ${currentSong.title} :musical_note:`, value: `${bar}` }
                )
                .setFooter({ text: `Duracion: ${currentSong.duration}`, iconURL: image})
                .setTimestamp()
                .setColor('#b2a89e')
            
		} else if (interaction.options.getSubcommand() === "playlist") {
            let url = interaction.options.getString("url")
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_PLAYLIST
            })

            if (result.tracks.length === 0){
                return interaction.editReply({
                    embeds: [new MessageEmbed()
                        .setDescription(`:x:Sin resultados!`)
                        .setColor('#b2a89e')
                    ]
                })
            }
            
            const playlist = result.playlist
            await queue.addTracks(result.tracks)
        
            const options = interaction.options._hoistedOptions;
            const user = (options.find((e) => e.name === "user") && options.find((e) => e.name === "user").member.user) || interaction.user;
            const image = user.displayAvatarURL()

            embed
                .setDescription(`**${result.tracks.length} Las canciones de: [${playlist.title}](${playlist.url})** han sido añadidas a la lista`)
                .setThumbnail(playlist.thumbnail)
                .setFooter({iconURL: image})
                .setTimestamp()
                .setColor('#b2a89e')
            
		} else if (interaction.options.getSubcommand() === "search") {
            let url = interaction.options.getString("searchterms")
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO
            })

            if (result.tracks.length === 0){
                return interaction.editReply({
                    embeds: [new MessageEmbed()
                        .setDescription(`:x:Sin resultados!`)
                        .setColor('#b2a89e')
                    ]
                })
            }
                
            const song = result.tracks[0]
            await queue.addTrack(song)
            
            let bar = queue.createProgressBar({
                queue: false,
                length: 20,
            })

            const options = interaction.options._hoistedOptions;
            const user = (options.find((e) => e.name === "user") && options.find((e) => e.name === "user").member.user) || interaction.user;
            const currentSong = queue.current
            const image = user.displayAvatarURL()

            embed
                .setDescription(`**[${song.title}](${song.url})** \n añadido a la lista de reproduccion!`)
                .setThumbnail(song.thumbnail)
                .addFields(
                    { name: `:musical_note: Reproduciendo: ${currentSong.title} :musical_note:`, value: `${bar}` }
                )
                .setFooter({ text: `Duracion: ${currentSong.duration}`, iconURL: image})
                .setTimestamp()
                .setColor('#b2a89e')
            
		}
        if (!queue.playing) await queue.play()
        await interaction.editReply({
            embeds: [embed]

        })
	}
}
