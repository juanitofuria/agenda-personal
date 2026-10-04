package com.agendapersonal.sections

import android.content.Context
import com.agendapersonal.data.Prefs
import com.agendapersonal.net.Http
import com.agendapersonal.net.NewsItem
import com.agendapersonal.net.Rss

/** Noticias nacionales (economía, política, fútbol, motociclismo) + provincia, ayuntamientos y vigilancia de nombres. */
object NewsSection : Section {
    override val id = "news"
    override val title = "Noticias"
    override val description = "Economía, política, fútbol, motociclismo y noticias locales"
    override val defaultHour = 7
    override val defaultMinute = 10

    private const val PER_TOPIC = 5

    /** Temas fijos: (título, consulta de Google News). Edita esta lista para añadir o cambiar temas. */
    private val topics = listOf(
        "💶 Economía" to "economía España",
        "🏛️ Política" to "política nacional España",
        "⚽ Fútbol" to "fútbol",
        "🏍️ Motociclismo" to "MotoGP OR motociclismo OR Superbike",
    )

    override suspend fun build(context: Context): Digest {
        val prefs = Prefs(context)
        val b = DigestBuilder()
        val seen = HashSet<String>()

        for ((name, query) in topics) {
            b.part(name) { section(name, fetch("$query when:1d"), seen) }
        }

        val province = prefs.province.trim()
        if (province.isNotEmpty()) {
            b.part("📍 $province") {
                section("📍 Provincia de $province", fetch("\"$province\" OR \"Diputación de $province\" when:1d"), seen)
            }
        }
        for (town in prefs.lines(prefs.councils)) {
            val scope = if (province.isNotEmpty()) " \"$province\"" else ""
            b.part("🏛️ Ayuntamiento de $town") {
                val q = "\"Ayuntamiento de $town\" OR \"alcalde de $town\" OR \"alcaldesa de $town\" when:7d"
                section("🏛️ Ayuntamiento de $town", fetch(q), seen)
            }
            b.part("🏘️ $town") { section("🏘️ $town", fetch("\"$town\"$scope when:2d"), seen) }
        }
        for (term in prefs.lines(prefs.watchTerms)) {
            b.part("🔎 $term") { section("🔎 $term", fetch("\"$term\" when:3d"), seen) }
        }
        for (feed in prefs.lines(prefs.customFeeds)) {
            b.part("RSS $feed") {
                val items = Rss.parse(Http.get(feed)).sortedByDescending { it.publishedMs }
                section("📰 ${hostOf(feed)}", items, seen)
            }
        }
        return b.build("Noticias del día", "Resumen de economía, política, deportes y noticias locales")
    }

    private suspend fun fetch(query: String): List<NewsItem> =
        Rss.parse(Http.get(Rss.googleNewsUrl(query))).sortedByDescending { it.publishedMs }

    private fun section(name: String, items: List<NewsItem>, seen: MutableSet<String>): String? {
        val fresh = items.filter { seen.add(it.title.lowercase().take(60)) }.take(PER_TOPIC)
        if (fresh.isEmpty()) return null
        return buildString {
            append(name)
            fresh.forEach { append("\n• ").append(it.title); if (it.source.isNotEmpty()) append(" (${it.source})") }
        }
    }

    private fun hostOf(url: String) = runCatching { java.net.URI(url).host }.getOrNull() ?: url
}
