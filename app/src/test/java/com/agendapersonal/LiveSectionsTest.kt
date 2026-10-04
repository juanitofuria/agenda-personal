package com.agendapersonal

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.agendapersonal.net.Rss
import com.agendapersonal.sections.SectionRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LiveSectionsTest {
    private val ctx: Context get() = ApplicationProvider.getApplicationContext()

    @Test
    fun rssParsesGoogleNewsFixture() {
        val xml = javaClass.classLoader!!.getResource("gnews.xml")!!.readText()
        val items = Rss.parse(xml)
        assertTrue("sin items", items.size > 5)
        assertTrue(items.all { it.title.isNotBlank() })
        assertTrue("sin medio", items.count { it.source.isNotBlank() } > items.size / 2)
        assertTrue("sin fecha", items.all { it.publishedMs > 0 })
        assertFalse("el título conserva ' - Medio'", items.first().title.endsWith(" - ${items.first().source}"))
    }

    /** Una sección personalizada obtiene noticias reales. Solo con LIVE=1. */
    @Test
    fun liveCustomTopic() {
        assumeTrue(System.getenv("LIVE") == "1")
        val section = com.agendapersonal.sections.TopicSection(com.agendapersonal.sections.CustomTopic("ajedrez", "Ajedrez", "♟️", "ajedrez"))
        var d = runBlocking { section.build(ctx) }
        repeat(3) { if (!d.ok || d.preview.isEmpty()) d = runBlocking { section.build(ctx) } }
        println("\n######## TOPIC ${d.title} | ${d.preview.size} titulares\n" + d.body)
        assertTrue(d.ok); assertTrue(d.preview.isNotEmpty())
    }

    /** Ejecuta cada sección contra Internet real. Solo con LIVE=1. */
    @Test
    fun liveSections() {
        assumeTrue(System.getenv("LIVE") == "1")
        for (section in SectionRegistry.all) {
            var digest = runBlocking { section.build(ctx) }
            repeat(4) { if (!digest.ok) digest = runBlocking { section.build(ctx) } } // red intermitente
            println("\n######## ${section.title} | ok=${digest.ok} | ${digest.summary}\n${digest.body}")
            println("-- preview:\n" + digest.preview.joinToString("\n"))
            assertTrue("${section.id} sin datos", digest.ok)
            assertTrue("${section.id} sin vista previa", digest.preview.isNotEmpty())
            if (section.id == "weather") {
                val w = com.agendapersonal.sections.WeatherData.fromJson(digest.extra)
                assertNotNull("tiempo sin datos para la gráfica", w)
                assertTrue("amanecer inválido: '${w!!.sunrise}'", Regex("\\d{2}:\\d{2}").matches(w.sunrise))
                assertTrue("anochecer inválido: '${w.sunset}'", Regex("\\d{2}:\\d{2}").matches(w.sunset))
                assertTrue("humedad fuera de rango", w.hours.all { it.humidity in 0..100 })
                assertTrue("UV fuera de rango", w.uvMax in 0.0..16.0)
                println("-- sol ${w.sunrise}-${w.sunset} · UV ${w.uvMax} · rad ${w.radiationSum} MJ/m² · viento ${w.windMax}/${w.gustMax} km/h ${com.agendapersonal.sections.WeatherData.compass(w.windDir)} · hum ${w.hours.first().humidity}%")
                println("-- lluvia: ${w.rainOutlook()}")
                println("-- gráfica: ${w!!.hours.size} horas, " + w.hours.joinToString { "${it.hour}h ${it.temp.toInt()}º p${it.prob}%" })
            }
        }
    }
}
