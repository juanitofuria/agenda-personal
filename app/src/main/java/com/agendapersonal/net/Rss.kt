package com.agendapersonal.net

import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory
import java.io.StringReader
import java.text.SimpleDateFormat
import java.util.Locale

data class NewsItem(val title: String, val source: String, val link: String, val publishedMs: Long)

object Rss {
    /** Parsea RSS 2.0 (y Atom básico). Los títulos de Google News vienen como "Titular - Medio". */
    fun parse(xml: String): List<NewsItem> {
        val parser = XmlPullParserFactory.newInstance().newPullParser()
        parser.setInput(StringReader(xml))
        val items = mutableListOf<NewsItem>()
        var title = ""; var link = ""; var source = ""; var date = ""
        var inItem = false
        var event = parser.eventType
        while (event != XmlPullParser.END_DOCUMENT) {
            when (event) {
                XmlPullParser.START_TAG -> when (parser.name) {
                    "item", "entry" -> { inItem = true; title = ""; link = ""; source = ""; date = "" }
                    "title" -> if (inItem) title = parser.nextText().trim()
                    "link" -> if (inItem) {
                        val href = parser.getAttributeValue(null, "href")
                        link = href ?: parser.nextText().trim()
                    }
                    "source" -> if (inItem) source = parser.nextText().trim()
                    "pubDate", "published", "updated" -> if (inItem) date = parser.nextText().trim()
                }
                XmlPullParser.END_TAG -> if (parser.name == "item" || parser.name == "entry") {
                    inItem = false
                    if (title.isNotEmpty()) {
                        var t = title
                        var s = source
                        val idx = t.lastIndexOf(" - ")
                        if (s.isEmpty() && idx > 0) { s = t.substring(idx + 3); t = t.substring(0, idx) }
                        else if (idx > 0 && t.endsWith(" - $s")) t = t.substring(0, idx)
                        items += NewsItem(t, s, link, parseDate(date))
                    }
                }
            }
            event = parser.next()
        }
        return items
    }

    private fun parseDate(s: String): Long {
        if (s.isEmpty()) return 0
        val patterns = listOf("EEE, dd MMM yyyy HH:mm:ss zzz", "EEE, dd MMM yyyy HH:mm:ss Z", "yyyy-MM-dd'T'HH:mm:ssXXX")
        for (p in patterns) {
            runCatching { return SimpleDateFormat(p, Locale.ENGLISH).parse(s)!!.time }
        }
        return 0
    }

    fun googleNewsUrl(query: String, lang: String = "es", country: String = "ES") =
        "https://news.google.com/rss/search?q=${Http.enc(query)}&hl=$lang&gl=$country&ceid=$country:$lang"
}
