package com.agendapersonal.sections

import android.content.Context
import com.agendapersonal.data.Prefs
import com.agendapersonal.net.Http
import com.agendapersonal.net.NewsItem
import com.agendapersonal.net.Rss
import org.json.JSONArray
import org.json.JSONObject
import java.text.Normalizer

/** Una sección creada por el usuario: noticias sobre un tema que le interesa. */
data class CustomTopic(val id: String, val title: String, val emoji: String, val query: String)

object CustomTopics {
    fun parse(raw: String): List<CustomTopic> = runCatching {
        val arr = JSONArray(raw)
        (0 until arr.length()).map {
            val o = arr.getJSONObject(it)
            CustomTopic(o.getString("id"), o.getString("title"), o.optString("emoji", "⭐"), o.getString("query"))
        }
    }.getOrDefault(emptyList())

    fun toJson(list: List<CustomTopic>): String = JSONArray(list.map {
        JSONObject().put("id", it.id).put("title", it.title).put("emoji", it.emoji).put("query", it.query)
    }).toString()

    fun slug(text: String): String =
        Normalizer.normalize(text.lowercase(), Normalizer.Form.NFD).replace(Regex("\\p{M}+"), "").replace(Regex("[^a-z0-9]+"), "-").trim('-').ifEmpty { "tema" }

    fun load(prefs: Prefs) = parse(prefs.customTopicsJson)

    /** Añade un tema (si ya existe uno con el mismo id lo sustituye). Devuelve el tema guardado. */
    fun add(prefs: Prefs, title: String, query: String, emoji: String = "⭐"): CustomTopic {
        val topic = CustomTopic(slug(title), title.trim(), emoji, query.trim().ifEmpty { title.trim() })
        prefs.customTopicsJson = toJson(load(prefs).filterNot { it.id == topic.id } + topic)
        return topic
    }

    fun remove(prefs: Prefs, id: String) {
        prefs.customTopicsJson = toJson(load(prefs).filterNot { it.id == id })
    }
}

/** Sección de noticias sobre un tema personalizado. */
class TopicSection(val topic: CustomTopic) : Section {
    override val id = "topic_${topic.id}"
    override val title = topic.title
    override val description = "Noticias sobre ${topic.title.lowercase()}"
    override val defaultHour = 8
    override val defaultMinute = 30 + (topic.id.hashCode() and 0x7FFFFFFF) % 25 // escalonadas: 8:30–8:54
    override val emoji = topic.emoji
    override val accent = listOf(0xFF2563EB, 0xFFDB2777, 0xFF059669, 0xFFEA580C, 0xFF7C3AED, 0xFF0891B2)[(topic.id.hashCode() and 0x7FFFFFFF) % 6].toInt()

    override suspend fun build(context: Context): Digest {
        val b = DigestBuilder()
        var items = emptyList<NewsItem>()
        b.part(topic.title) {
            items = Rss.parse(Http.get(Rss.googleNewsUrl("${topic.query} when:2d")))
                .sortedByDescending { it.publishedMs }
                .distinctBy { it.title.lowercase().take(60) }
                .take(8)
            if (items.isEmpty()) "${topic.emoji} ${topic.title}\nSin novedades en las últimas horas."
            else "${topic.emoji} ${topic.title}\n" + items.joinToString("\n") {
                "• ${it.title}" + if (it.source.isNotEmpty()) " (${it.source})" else ""
            }
        }
        return b.build(topic.title, items.firstOrNull()?.title ?: "Sin novedades", items.take(4).map { "${topic.emoji} ${it.title}" })
    }
}
