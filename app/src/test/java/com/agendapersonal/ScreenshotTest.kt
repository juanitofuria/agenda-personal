package com.agendapersonal

import android.content.Context
import android.graphics.Bitmap
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.background
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.unit.dp
import android.graphics.Canvas
import androidx.test.core.app.ApplicationProvider
import com.agendapersonal.data.AppDb
import com.agendapersonal.data.Appointment
import com.agendapersonal.data.Prefs
import com.agendapersonal.data.Task
import com.agendapersonal.sections.Digest
import com.agendapersonal.sections.DigestStore
import com.agendapersonal.sections.SectionRegistry
import com.agendapersonal.ui.*
import kotlinx.coroutines.runBlocking
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/** Genera capturas en app/build/screenshots para revisar el diseño. Solo con SHOTS=1. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = "w411dp-h891dp-xxhdpi")
class ScreenshotTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    private val ctx: Context get() = ApplicationProvider.getApplicationContext()

    private fun shot(name: String) {
        val view = rule.activity.window.decorView
        val bmp = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        view.draw(Canvas(bmp))
        val dir = File("build/screenshots").apply { mkdirs() }
        File(dir, "$name.png").outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }

    private fun seed() = runBlocking {
        val db = AppDb.get(ctx).also { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) { it.clearAllTables() } }
        val day = 86_400_000L
        val now = System.currentTimeMillis()
        db.tasks().insert(Task(title = "Renovar el seguro del coche", remindAt = now + 3 * 3_600_000))
        db.tasks().insert(Task(title = "Llamar al fontanero", remindAt = now - 3_600_000))
        db.tasks().insert(Task(title = "Comprar pan y fruta"))
        db.tasks().insert(Task(title = "Pagar el recibo de la luz", done = true))
        db.appointments().insert(Appointment(title = "Cardiología", place = "Hospital Reina Sofía, Córdoba", at = now + 20 * 3_600_000, remindMinutesBefore = 180))
        db.appointments().insert(Appointment(title = "Análisis de sangre", place = "Centro de salud de Montoro", at = now + 4 * day, remindMinutesBefore = 1440))
        db.appointments().insert(Appointment(title = "Revisión dentista", at = now + 20 * day))
        db.appointments().insert(Appointment(title = "Oftalmología", place = "Clínica Vista", at = now - 5 * day))
        val prefs = Prefs(ctx)
        DigestStore.save(ctx, "weather", Digest("Tiempo · Montoro", "", WEATHER))
        DigestStore.save(ctx, "markets", Digest("Mercados · premercado EEUU", "", MARKETS))
        prefs.setTime("markets", 14, 0)
    }

    private fun screens(suffix: String, dark: Boolean) {
        // Una sola composición: setContent solo puede llamarse una vez por test.
        val scene = mutableStateOf<Any>(Tab.Home)
        rule.setContent {
            AgendaTheme(dark) {
                when (val s = scene.value) {
                    is Tab -> AppRoot(mutableStateOf<String?>(null), s)
                    else -> Column(Modifier.background(MaterialTheme.colorScheme.background).padding(20.dp)) { DigestContent(s as String) }
                }
            }
        }
        for (tab in Tab.entries) {
            scene.value = tab
            rule.waitForIdle()
            shot("${tab.name.lowercase()}_$suffix")
        }
        scene.value = MARKETS; rule.waitForIdle(); shot("detail_markets_$suffix")
        scene.value = WEATHER; rule.waitForIdle(); shot("detail_weather_$suffix")
    }

    @Test
    fun light() { if (System.getenv("SHOTS") != "1") return; seed(); screens("light", false) }

    @Test
    fun dark() { if (System.getenv("SHOTS") != "1") return; seed(); screens("dark", true) }

    companion object {
        const val WEATHER = """🌤️ Montoro · hoy
Máx 27.8º · mín 19.2º · cubierto

07:00  ☁️ 20.1º  💧10%  0 mm  💨4 km/h
08:00  ☁️ 21.4º  💧12%  0 mm  💨5.2 km/h
09:00  🌤️ 23.2º  💧8%  0 mm  💨6 km/h
10:00  🌤️ 25º  💧5%  0 mm  💨7.5 km/h

🌧️ Ayer llovió 0.5 l/m².
Acumulado 2026: 475.7 l/m² (desde el 1 de enero)."""

        const val MARKETS = """📈 PREMERCADO (futuros y activos refugio)
🟢 S&P 500 fut.  7,777  (+0.69%)
🟢 Nasdaq 100 fut.  31,062  (+0.98%)
🔴 VIX  15.31  (-6.59%)
🔴 EUR/USD  1.1257  (-0.62%)

📰 NOTICIAS ECONÓMICAS
• Dow, S&P 500, Nasdaq Futures Edge Higher Ahead Of PPI, Jobless Claims (Stocktwits)
• OXY, BATL, USO, UCO Stocks Surge Premarket As Brent Breaks Above ${'$'}94 A Barrel (Stocktwits)

📊 CIERRE DE LA ÚLTIMA SESIÓN
🟢 S&P 500  7,723  (+0.73%)  · 2026-10-02
🔴 Nikkei 225  68,309  (-0.94%)  · 2026-10-02"""
    }
}
