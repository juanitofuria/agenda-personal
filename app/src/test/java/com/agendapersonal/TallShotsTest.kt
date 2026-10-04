package com.agendapersonal

import android.graphics.Bitmap
import android.graphics.Canvas
import androidx.activity.ComponentActivity
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.core.app.ApplicationProvider
import com.agendapersonal.data.Prefs
import com.agendapersonal.sections.*
import com.agendapersonal.ui.*
import kotlinx.coroutines.runBlocking
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/** Pantallas largas completas (tiempo y horóscopo) en una ventana alta. Solo con SHOTS=1. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = "w411dp-h4300dp-xhdpi")
class TallShotsTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()

    @Test fun home() {
        if (System.getenv("SHOTS") != "1") return
        val ctx = ApplicationProvider.getApplicationContext<android.content.Context>()
        val prefs = Prefs(ctx); prefs.birthDate = "1984-04-05"; prefs.setEnabled("horoscope", true)
        DigestStore.save(ctx, "weather", Digest("Tiempo · Montoro", "x", "b", ScreenshotTest.WEATHER_PREVIEW, ScreenshotTest.SAMPLE_WEATHER.toJson()))
        DigestStore.save(ctx, "news", Digest("Noticias del día", "x", "b", ScreenshotTest.NEWS_PREVIEW))
        DigestStore.save(ctx, "agenda", Digest("Tu agenda de hoy", "x", "b", ScreenshotTest.AGENDA_PREVIEW))
        DigestStore.save(ctx, "markets", Digest("Mercados", "x", "b", ScreenshotTest.MARKETS_PREVIEW))
        DigestStore.save(ctx, "horoscope", runBlocking { HoroscopeSection.build(ctx) })
        val t = CustomTopics.add(prefs, "Ajedrez", "ajedrez", "♟️")
        DigestStore.save(ctx, "topic_${t.id}", Digest("Ajedrez", "x", "b", listOf("♟️ Carlsen gana el torneo de Stavanger", "♟️ Gukesh, nuevo líder del ranking mundial", "♟️ Llega el Mundial de ajedrez rápido")))
        rule.setContent { AgendaTheme(false) { AppRoot(mutableStateOf<String?>(null)) } }
        rule.waitForIdle()
        val view = rule.activity.window.decorView
        val bmp = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        view.draw(Canvas(bmp))
        File("build/screenshots").apply { mkdirs() }.let { d -> File(d, "full_home.png").outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) } }
    }

    @Test fun tall() {
        if (System.getenv("SHOTS") != "1") return
        val ctx = ApplicationProvider.getApplicationContext<android.content.Context>()
        val prefs = Prefs(ctx); prefs.birthDate = "1984-04-05"
        DigestStore.save(ctx, "weather", Digest("Tiempo · Montoro", "x", "b", ScreenshotTest.WEATHER_PREVIEW, ScreenshotTest.SAMPLE_WEATHER.toJson()))
        DigestStore.save(ctx, "horoscope", runBlocking { HoroscopeSection.build(ctx) })
        for (dark in listOf(false, true)) {
            val scene = mutableStateOf<Section>(WeatherSection)
            if (!dark) rule.setContent { AgendaTheme(false) { SectionDetailScreen(scene.value, onBack = {}) } }
            else rule.runOnUiThread { }
            for (sec in listOf(WeatherSection, HoroscopeSection)) {
                if (dark) break
                scene.value = sec; rule.waitForIdle()
                val view = rule.activity.window.decorView
                val bmp = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
                view.draw(Canvas(bmp))
                File("build/screenshots").apply { mkdirs() }.let { d -> File(d, "full_${sec.id}.png").outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) } }
            }
        }
    }
}
