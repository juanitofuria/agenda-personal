package com.agendapersonal.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agendapersonal.sections.HourPoint
import com.agendapersonal.sections.WeatherData
import com.agendapersonal.sections.WeatherIcons
import java.util.Locale
import kotlin.math.roundToInt

private fun deg(v: Double) = "${v.roundToInt()}º"
private fun num(v: Double) = String.format(Locale("es", "ES"), "%.1f", v).removeSuffix(",0")

/**
 * Gráfica de temperatura por horas: horas en el eje X, temperatura en el Y (línea con relleno),
 * icono del tiempo sobre cada tramo y barras de probabilidad de lluvia en la base.
 */
@Composable
fun HourlyChart(hours: List<HourPoint>, modifier: Modifier = Modifier, height: Dp = 230.dp, compact: Boolean = false) {
    if (hours.size < 2) return
    val tm = rememberTextMeasurer()
    val line = LocalAccents.current.weather
    val rain = LocalAccents.current.weather
    val label = MaterialTheme.colorScheme.onSurfaceVariant
    val strong = MaterialTheme.colorScheme.onSurface
    val grid = MaterialTheme.colorScheme.outlineVariant

    Canvas(modifier.fillMaxWidth().height(height)) {
        val padX = 14.dp.toPx()
        val iconH = (if (compact) 24.dp else 30.dp).toPx()
        val tempLabelH = 18.dp.toPx()
        val axisH = 20.dp.toPx()
        val barsH = (if (compact) 0.dp else 34.dp).toPx()
        val plotTop = iconH + tempLabelH
        val plotBottom = size.height - axisH - barsH - 6.dp.toPx()
        val plotW = size.width - 2 * padX
        val n = hours.size
        val step = if (compact) 3 else if (n > 12) 3 else 2

        val tMin = hours.minOf { it.temp } - 1
        val tMax = hours.maxOf { it.temp } + 1
        fun x(i: Int) = padX + plotW * i / (n - 1)
        fun y(t: Double) = (plotBottom - (t - tMin) / (tMax - tMin) * (plotBottom - plotTop)).toFloat()

        // Guías horizontales suaves.
        for (k in 0..2) {
            val gy = plotTop + (plotBottom - plotTop) * k / 2
            drawLine(grid, Offset(padX, gy), Offset(size.width - padX, gy), strokeWidth = 1.dp.toPx())
        }

        // Línea de temperatura (curva suave) + relleno degradado.
        val path = Path().apply {
            moveTo(x(0), y(hours[0].temp))
            for (i in 1 until n) {
                val mx = (x(i - 1) + x(i)) / 2
                cubicTo(mx, y(hours[i - 1].temp), mx, y(hours[i].temp), x(i), y(hours[i].temp))
            }
        }
        val fill = Path().apply {
            addPath(path); lineTo(x(n - 1), plotBottom); lineTo(x(0), plotBottom); close()
        }
        drawPath(fill, Brush.verticalGradient(listOf(line.copy(alpha = 0.28f), line.copy(alpha = 0f)), startY = plotTop, endY = plotBottom))
        drawPath(path, line, style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round))

        // Barras de probabilidad de lluvia.
        if (barsH > 0) {
            val bw = (plotW / n * 0.55f)
            val base = size.height - axisH
            hours.forEachIndexed { i, h ->
                if (h.prob < 10) return@forEachIndexed
                val bh = barsH * h.prob / 100f
                drawRoundRect(rain.copy(alpha = 0.55f), Offset(x(i) - bw / 2, base - bh), Size(bw, bh.coerceAtLeast(1.5.dp.toPx())), androidx.compose.ui.geometry.CornerRadius(2.dp.toPx()))
            }
        }

        hours.forEachIndexed { i, h ->
            drawCircle(Color.White, 4.5.dp.toPx(), Offset(x(i), y(h.temp)))
            drawCircle(line, 3.dp.toPx(), Offset(x(i), y(h.temp)))
            if (i % step == 0) {
                // Icono, temperatura y hora.
                val icon = tm.measure(WeatherIcons.emoji(h.code), TextStyle(fontSize = if (compact) 15.sp else 19.sp))
                drawText(icon, topLeft = Offset(x(i) - icon.size.width / 2f, (iconH - icon.size.height) / 2f))
                val t = tm.measure(deg(h.temp), TextStyle(fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = strong))
                drawText(t, topLeft = Offset(x(i) - t.size.width / 2f, iconH + (tempLabelH - t.size.height) / 2f - 1.dp.toPx()))
                val hr = tm.measure("%02d h".format(h.hour), TextStyle(fontSize = 10.sp, color = label))
                drawText(hr, topLeft = Offset(x(i) - hr.size.width / 2f, size.height - axisH + 3.dp.toPx()))
                if (barsH > 0 && h.prob >= 30) {
                    val pr = tm.measure("${h.prob}%", TextStyle(fontSize = 9.sp, color = rain, fontWeight = FontWeight.SemiBold))
                    drawText(pr, topLeft = Offset(x(i) - pr.size.width / 2f, size.height - axisH - barsH * h.prob / 100f - pr.size.height - 1.dp.toPx()))
                }
            }
        }
    }
}

/** Pantalla completa del tiempo: resumen, gráfica por horas, lista hora a hora y lluvia. */
@Composable
fun WeatherView(data: WeatherData) {
    val accents = LocalAccents.current
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        // Resumen del día.
        AppCard(Modifier.fillMaxWidth()) {
            Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(WeatherIcons.emoji(data.code), fontSize = 54.sp)
                Spacer(Modifier.width(16.dp))
                Column(Modifier.weight(1f)) {
                    Text(data.place, style = MaterialTheme.typography.titleMedium)
                    Text(WeatherIcons.describe(data.code).replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(deg(data.tMax), style = MaterialTheme.typography.headlineMedium)
                    Text("mín ${deg(data.tMin)}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        // Gráfica.
        AppCard(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(horizontal = 6.dp, vertical = 14.dp)) {
                Text("Próximas horas", style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(start = 12.dp, bottom = 4.dp))
                HourlyChart(data.hours)
                Text(
                    "Línea: temperatura · Barras: probabilidad de lluvia",
                    style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 12.dp, top = 4.dp),
                )
            }
        }

        // Una hora por fila.
        AppCard(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(vertical = 8.dp)) {
                Text("Hora a hora", style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(start = 16.dp, top = 8.dp, bottom = 4.dp))
                data.hours.forEachIndexed { i, h ->
                    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("%02d:00".format(h.hour), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary, modifier = Modifier.width(58.dp))
                        Text(WeatherIcons.emoji(h.code), fontSize = 22.sp, modifier = Modifier.width(40.dp))
                        Text(deg(h.temp), style = MaterialTheme.typography.titleMedium, modifier = Modifier.width(48.dp))
                        Text(WeatherIcons.describe(h.code), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
                        Text("💧 ${h.prob}%", style = MaterialTheme.typography.bodySmall, color = if (h.prob >= 50) accents.weather else MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.width(58.dp))
                        Text("💨 ${h.wind.roundToInt()}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    if (i < data.hours.lastIndex) HorizontalDivider(Modifier.padding(horizontal = 16.dp), color = MaterialTheme.colorScheme.outlineVariant)
                }
            }
        }

        // Lluvia de ayer y acumulada.
        if (data.rainYesterday != null && data.rainYear != null) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatTile("🌧️", "Ayer", if (data.rainYesterday >= 0.1) "${num(data.rainYesterday)} l/m²" else "Sin lluvia", Modifier.weight(1f))
                StatTile("📅", "Acumulado ${data.year}", "${num(data.rainYear)} l/m²", Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun StatTile(emoji: String, title: String, value: String, modifier: Modifier = Modifier) {
    AppCard(modifier) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(emoji, fontSize = 24.sp)
            Spacer(Modifier.height(4.dp))
            Text(title, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.titleLarge)
        }
    }
}
