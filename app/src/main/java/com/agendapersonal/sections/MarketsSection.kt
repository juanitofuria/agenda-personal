package com.agendapersonal.sections

import android.content.Context
import com.agendapersonal.net.Http
import com.agendapersonal.net.NewsItem
import com.agendapersonal.net.Rss
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.Locale
import kotlin.math.abs

/** Premercado de Wall Street + resumen de cierre de la última sesión (Yahoo Finance, API no oficial). */
object MarketsSection : Section {
    override val id = "markets"
    override val title = "Mercados"
    override val description = "Noticias económicas de premercado y resumen de la sesión anterior"
    override val defaultHour = 14
    override val defaultMinute = 0

    private val futures = listOf(
        "S&P 500 fut." to "ES=F", "Nasdaq 100 fut." to "NQ=F", "Dow Jones fut." to "YM=F",
        "VIX" to "^VIX", "Petróleo WTI" to "CL=F", "Oro" to "GC=F",
        "EUR/USD" to "EURUSD=X", "Bono EEUU 10a (%)" to "^TNX", "Bitcoin" to "BTC-USD",
    )
    private val indices = listOf(
        "S&P 500" to "^GSPC", "Nasdaq" to "^IXIC", "Dow Jones" to "^DJI", "Russell 2000" to "^RUT",
        "IBEX 35" to "^IBEX", "Euro Stoxx 50" to "^STOXX50E", "DAX" to "^GDAXI", "Nikkei 225" to "^N225",
    )

    private data class Quote(val price: Double, val prev: Double) {
        val pct get() = if (prev == 0.0) 0.0 else (price - prev) / prev * 100
    }

    override suspend fun build(context: Context): Digest {
        val b = DigestBuilder()
        var headline = "Premercado y cierre de ayer"

        b.part("Premercado") {
            val lines = futures.mapNotNull { (name, sym) ->
                runCatching { live(sym) }.getOrNull()?.let { "${arrow(it.pct)} $name  ${num(it.price)}  (${pct(it.pct)})" }
            }
            if (lines.isEmpty()) throw IllegalStateException("sin datos de futuros")
            val spx = runCatching { live("ES=F") }.getOrNull()
            if (spx != null) headline = "Futuros S&P 500 ${pct(spx.pct)} · premercado EEUU"
            "📈 PREMERCADO (futuros y activos refugio)\n" + lines.joinToString("\n")
        }

        b.part("Noticias premercado") {
            val en = fetch(Rss.googleNewsUrl("premarket stocks futures Wall Street when:1d", "en", "US"))
            val es = fetch(Rss.googleNewsUrl("bolsa Wall Street premercado when:1d"))
            val items = (es.take(4) + en.take(5)).distinctBy { it.title.lowercase().take(50) }
            if (items.isEmpty()) null else "📰 NOTICIAS ECONÓMICAS\n" + items.joinToString("\n") { bullet(it) }
        }

        b.part("Cierre anterior") {
            val lines = indices.mapNotNull { (name, sym) ->
                runCatching { lastSession(sym) }.getOrNull()?.let { (date, q) ->
                    "${arrow(q.pct)} $name  ${num(q.price)}  (${pct(q.pct)})  · $date"
                }
            }
            if (lines.isEmpty()) throw IllegalStateException("sin datos de índices")
            "📊 CIERRE DE LA ÚLTIMA SESIÓN\n" + lines.joinToString("\n")
        }

        b.part("Noticias de cierre") {
            val es = fetch(Rss.googleNewsUrl("\"Wall Street\" cierre sesión Ibex when:2d"))
            val ibex = fetch(Rss.googleNewsUrl("Ibex 35 cierre sesión when:1d"))
            val items = (es.take(5) + ibex.take(3)).distinctBy { it.title.lowercase().take(50) }
            if (items.isEmpty()) null else "🗞️ CRÓNICA DE MERCADOS\n" + items.joinToString("\n") { bullet(it) }
        }
        return b.build("Mercados · premercado EEUU", headline)
    }

    private val quotePage = Regex("Stock Price|Quote & History|Gráficos, datos y noticias|Cotización|Historical Prices", RegexOption.IGNORE_CASE)

    /** Descarta fichas de cotización que Google News mezcla con las noticias. */
    private suspend fun fetch(url: String): List<NewsItem> =
        Rss.parse(Http.get(url)).filter { !quotePage.containsMatchIn(it.title) }.sortedByDescending { it.publishedMs }

    private fun bullet(i: NewsItem) = "• ${i.title}" + if (i.source.isNotEmpty()) " (${i.source})" else ""

    private suspend fun chart(symbol: String, range: String, interval: String): JSONObject {
        val url = "https://query1.finance.yahoo.com/v8/finance/chart/${Http.enc(symbol)}?range=$range&interval=$interval"
        return JSONObject(Http.get(url)).getJSONObject("chart").getJSONArray("result").getJSONObject(0)
    }

    /**
     * Precio actual frente al cierre de la sesión anterior.
     * (No sirve `chartPreviousClose`: con range=5d es el cierre previo a la ventana, no el de ayer.)
     */
    private suspend fun live(symbol: String): Quote {
        val result = chart(symbol, "10d", "1d")
        val meta = result.getJSONObject("meta")
        val price = meta.getDouble("regularMarketPrice")
        val offset = meta.optInt("gmtoffset", 0)
        val zone = ZoneOffset.ofTotalSeconds(offset)
        val ts = result.getJSONArray("timestamp")
        val closes = result.getJSONObject("indicators").getJSONArray("quote").getJSONObject(0).getJSONArray("close")
        val rows = (0 until ts.length()).filter { !closes.isNull(it) }.map {
            LocalDate.ofInstant(Instant.ofEpochSecond(ts.getLong(it)), zone) to closes.getDouble(it)
        }
        val priceDay = LocalDate.ofInstant(Instant.ofEpochSecond(meta.optLong("regularMarketTime", ts.getLong(ts.length() - 1))), zone)
        // Si la última vela es la sesión del precio actual, la referencia es la anterior.
        val prev = rows.lastOrNull { it.first.isBefore(priceDay) }?.second
            ?: meta.optDouble("chartPreviousClose", price)
        return Quote(price, prev)
    }

    /** Última sesión completada (descarta la vela de hoy si aún está en curso) y su fecha. */
    private suspend fun lastSession(symbol: String): Pair<String, Quote> {
        val result = chart(symbol, "10d", "1d")
        val offset = result.getJSONObject("meta").optInt("gmtoffset", 0)
        val ts = result.getJSONArray("timestamp")
        val closes = result.getJSONObject("indicators").getJSONArray("quote").getJSONObject(0).getJSONArray("close")
        val today = LocalDate.now()
        val rows = (0 until ts.length()).filter { !closes.isNull(it) }.map {
            LocalDate.ofInstant(Instant.ofEpochSecond(ts.getLong(it)), ZoneOffset.ofTotalSeconds(offset)) to closes.getDouble(it)
        }.filter { it.first.isBefore(today) }
        if (rows.size < 2) throw IllegalStateException("datos insuficientes para $symbol")
        val (d, last) = rows.last()
        val prev = rows[rows.size - 2].second
        return d.toString() to Quote(last, prev)
    }

    private fun arrow(p: Double) = if (p > 0.05) "🟢" else if (p < -0.05) "🔴" else "⚪"
    private fun pct(p: Double) = String.format(Locale.US, "%+.2f%%", p)
    private fun num(v: Double) = when {
        abs(v) >= 1000 -> String.format(Locale.US, "%,.0f", v)
        abs(v) < 10 -> String.format(Locale.US, "%.4f", v) // divisas
        else -> String.format(Locale.US, "%.2f", v)
    }
}
