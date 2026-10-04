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

    /** Ejecuta cada sección contra Internet real. Solo con LIVE=1. */
    @Test
    fun liveSections() {
        assumeTrue(System.getenv("LIVE") == "1")
        for (section in SectionRegistry.all) {
            var digest = runBlocking { section.build(ctx) }
            repeat(4) { if (!digest.ok) digest = runBlocking { section.build(ctx) } } // red intermitente
            println("\n######## ${section.title} | ok=${digest.ok} | ${digest.summary}\n${digest.body}")
            assertTrue("${section.id} sin datos", digest.ok)
        }
    }
}
