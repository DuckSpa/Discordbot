const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { QueryType } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("plays a song")
    .addSubcommand((subcommand) => 
    subcommand.setName("song")
    .setDescription("plays a single song from url")
    .addStringOption((option) => option.setName("url").setDescription("the song url").setRequired(true))
    )
    .addSubcommand((subcommand) => 
    subcommand.setName("playlist")
    .setDescription("Loads a playlist")
    .addStringOption((option) => option.setName("url").setDescription("playlist url").setRequired(true))
    )
    .addSubcommand((subcommand) =>
    subcommand.setName("search")
    .setDescription("Search song by keywords")
    .addStringOption((option) => option.setName("searchterms").setRequired(true))),

    run: async({ client, interaction}) => {
        if(!interaction.member.voice.channel){
            return interaction.editReply("Necesitas estar en un chat de voz para usar el comando!");
        }

        const queue = await client.player.createQueue(interactoin.guild);
        if(!queue.connection) await queue.connect(interaction.member.voice.channel)

        let embed = new MessageEmbed()

        if(interaction.options.getSubcommand === "song"){
            let url = interaction.options.getString("url");
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_VIDEO
            })

            if(result.tracks.length === 0){
               return interaction.editReply("No hay resultados!")
            }

            const song = result.tracks[0];
            await queue.addTrack(song);
            embed
            .setDescription(`**[${song.title}](${song.url})** se ha agregado a la cola`)
            .setThumbnail(song.thumbnail)
            .setFooter( text `Duracion: ${song.duration}`)
        }
        
        else if(interaction.options.getSubcommand === "playlist"){
            let url = interaction.options.getString("url");
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_PLAYLIST
            })

            if(result.tracks.length === 0){
               return interaction.editReply("No hay resultados!")
            }

            const playlist = result.playlist
            await queue.addTracks(result.tracks);
            embed
            .setDescription(`**[${playlist.title}](${playlist.url})** se ha agregado a la cola`)
            .setThumbnail(playlist.thumbnail)
            .setFooter( text `Duracion: ${playlist.duration}`)
        }
        
        else if(interaction.options.getSubcommand === "search"){
            let url = interaction.options.getString("url");
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO
            })

            if(result.tracks.length === 0){
               return interaction.editReply("No hay resultados!")
            }

            const song = result.tracks[0]
            await queue.addTrack(song);
            embed
            .setDescription(`**[${song.title}](${song.url})** se ha agregado a la cola`)
            .setThumbnail(song.thumbnail)
            .setFooter( text `Duracion: ${song.duration}`)
        }

        if(!queue.playing) await queue.play();
        await interaction.editReply({
            embeds: [embed]
        })
    }

}