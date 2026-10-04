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
import com.agendapersonal.notify.Notifier
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
        DigestStore.save(ctx, "weather", Digest("Tiempo · Montoro", "☁️ cubierto, 19º/28º", WEATHER, WEATHER_PREVIEW))
        DigestStore.save(ctx, "news", Digest("Noticias del día", "Resumen", NEWS, NEWS_PREVIEW))
        DigestStore.save(ctx, "agenda", Digest("Tu agenda de hoy", "2 citas", "🩺 CITAS\n• Cardiología", AGENDA_PREVIEW))
        DigestStore.save(ctx, "markets", Digest("Mercados · premercado EEUU", "Futuros S&P 500 +0.69%", MARKETS, MARKETS_PREVIEW))
        prefs.setTime("markets", 14, 0)
    }

    private fun screens(suffix: String, dark: Boolean) {
        // Una sola composición: setContent solo puede llamarse una vez por test.
        val scene = mutableStateOf<Any>(Tab.Home)
        rule.setContent {
            AgendaTheme(dark) {
                when (val s = scene.value) {
                    is Tab -> AppRoot(mutableStateOf<String?>(null), s)
                    is com.agendapersonal.sections.Section -> SectionDetailScreen(s, onBack = {})
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
        scene.value = com.agendapersonal.sections.WeatherSection; rule.waitForIdle(); shot("section_weather_$suffix")
    }

    /** Dibuja las vistas personalizadas de la notificación (aproximación a cómo las pinta el sistema). */
    private fun notificationShot(name: String, dark: Boolean) {
        val themed = android.view.ContextThemeWrapper(ctx, if (dark) android.R.style.Theme_Material_NoActionBar else android.R.style.Theme_Material_Light_NoActionBar)
        val bg = if (dark) 0xFF2B2D33.toInt() else 0xFFFFFFFF.toInt()
        val density = ctx.resources.displayMetrics.density
        val col = android.widget.LinearLayout(themed).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setBackgroundColor(if (dark) 0xFF101114.toInt() else 0xFFE9EAEE.toInt())
            val pad = (16 * density).toInt(); setPadding(pad, pad, pad, pad)
        }
        val pairs = listOf(
            com.agendapersonal.sections.WeatherSection to Digest("Tiempo · Montoro", "☁️ cubierto, 19º/28º", "", WEATHER_PREVIEW),
            com.agendapersonal.sections.NewsSection to Digest("Noticias del día", "Resumen", "", NEWS_PREVIEW),
            com.agendapersonal.sections.MarketsSection to Digest("Mercados · premercado EEUU", "Futuros", "", MARKETS_PREVIEW),
            com.agendapersonal.sections.AgendaSection to Digest("Tu agenda de hoy", "2 citas", "", AGENDA_PREVIEW),
        )
        for ((section, digest) in pairs) {
            val (collapsed, expanded) = Notifier.digestViews(ctx, section, digest)
            for (rv in listOf(collapsed, expanded)) {
                val card = android.widget.FrameLayout(themed).apply {
                    setBackgroundColor(bg)
                    val p = (14 * density).toInt(); setPadding(p, p, p, p)
                }
                card.addView(rv.apply(themed, card))
                col.addView(card, android.widget.LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = (8 * density).toInt() })
            }
        }
        val w = (400 * density).toInt()
        col.measure(android.view.View.MeasureSpec.makeMeasureSpec(w, android.view.View.MeasureSpec.EXACTLY), android.view.View.MeasureSpec.makeMeasureSpec(0, android.view.View.MeasureSpec.UNSPECIFIED))
        col.layout(0, 0, col.measuredWidth, col.measuredHeight)
        val bmp = Bitmap.createBitmap(col.measuredWidth, col.measuredHeight, Bitmap.Config.ARGB_8888)
        col.draw(Canvas(bmp))
        File("build/screenshots").apply { mkdirs() }.let { File(it, "$name.png").outputStream().use { o -> bmp.compress(Bitmap.CompressFormat.PNG, 100, o) } }
    }

    @Test
    fun notifications() { if (System.getenv("SHOTS") != "1") return; notificationShot("notifications_light", false); notificationShot("notifications_dark", true) }

    @Test
    fun light() { if (System.getenv("SHOTS") != "1") return; seed(); screens("light", false) }

    @Test
    fun dark() { if (System.getenv("SHOTS") != "1") return; seed(); screens("dark", true) }

    companion object {
        val WEATHER_PREVIEW = listOf("☁️ Cubierto · 19º / 28º", "⏰ 7h 🌤️20º · 10h 🌤️25º · 13h ☁️28º · 16h ☁️27º", "🌧️ Ayer 0,5 l/m² · Año 475,7 l/m²")
        val NEWS_PREVIEW = listOf(
            "💶 El Banco de España aboga por un equilibrio entre disciplina y empoderamiento financiero",
            "🏛️ El Gobierno quiere dar luz verde en octubre al decreto de los centros de datos",
            "⚽ España tiene en su mano el pase a cuartos de la Liga de Naciones",
            "🏍️ Marc Márquez gana en Japón y recorta distancia en el Mundial",
            "🏛️ Montoro da un nuevo paso para el parque industrial Tecnóleum",
            "🏛️ El PSOE exige medidas fiscales para facilitar el acceso a la vivienda en Córdoba",
        )
        val NEWS = "💶 Economía\n• El Banco de España aboga por un equilibrio (El Confidencial)\n• Siguen las manifestaciones por la vivienda (elperiodico.com)\n\n🏛️ Ayuntamiento de Montoro\n• Montoro da un nuevo paso para el parque industrial Tecnóleum (El Día de Córdoba)"
        val AGENDA_PREVIEW = listOf("🩺 Cardiología · mañana 11:00 (Hospital Reina Sofía)", "🩺 Análisis de sangre · mañana 15:00", "✅ 3 tareas pendientes", "• Renovar el seguro del coche", "• Llamar al fontanero")
        val MARKETS_PREVIEW = listOf("📈 Futuros S&P 500 +0,69% · Nasdaq 100 +0,98% · Dow Jones +0,46%", "📊 Cierre S&P 500 +0,73% · IBEX 35 +0,42% · DAX +1,17%", "🛢️ Petróleo 91,11 · Oro 4.162", "📰 Dow, S&P 500, Nasdaq Futures Edge Higher Ahead Of PPI")
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
