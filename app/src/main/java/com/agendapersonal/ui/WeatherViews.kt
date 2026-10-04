package com.agendapersonal.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agendapersonal.sections.HourPoint
import com.agendapersonal.sections.MoonPhase
import com.agendapersonal.sections.WeatherData
import com.agendapersonal.sections.WeatherIcons
import java.text.SimpleDateFormat
import java.time.LocalDate
import java.time.LocalTime
import java.time.YearMonth
import java.util.Date
import java.util.Locale
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.roundToInt
import kotlin.math.sin

private val ES = Locale("es", "ES")
private fun deg(v: Double) = "${v.roundToInt()}º"
private fun num(v: Double) = String.format(ES, "%.1f", v).removeSuffix(",0")

/** Magnitud que dibuja la gráfica por horas. */
enum class ChartMetric(val label: String, val unit: String, val value: (HourPoint) -> Double, val fmt: (Double) -> String) {
    Temperature("Temp.", "º", { it.temp }, { "${it.roundToInt()}º" }),
    Humidity("Humedad", "%", { it.humidity.toDouble() }, { "${it.roundToInt()}%" }),
    Wind("Viento", " km/h", { it.wind }, { "${it.roundToInt()}" }),
    Uv("UV", "", { it.uv }, { num(it) }),
}

/**
 * Gráfica por horas: horas en el eje X y la magnitud elegida en el Y (línea con relleno), con el icono del tiempo
 * sobre cada tramo. En temperatura se añaden barras con la probabilidad de lluvia.
 */
@Composable
fun HourlyChart(
    hours: List<HourPoint>, modifier: Modifier = Modifier, height: Dp = 230.dp, compact: Boolean = false,
    metric: ChartMetric = ChartMetric.Temperature,
) {
    if (hours.size < 2) return
    val tm = rememberTextMeasurer()
    val a = LocalAccents.current
    val line = when (metric) { ChartMetric.Temperature -> a.weather; ChartMetric.Humidity -> a.agenda; ChartMetric.Wind -> a.news; ChartMetric.Uv -> a.markets }
    val rain = a.weather
    val label = MaterialTheme.colorScheme.onSurfaceVariant
    val strong = MaterialTheme.colorScheme.onSurface
    val grid = MaterialTheme.colorScheme.outlineVariant

    Canvas(modifier.fillMaxWidth().height(height)) {
        val padX = 14.dp.toPx()
        val iconH = (if (compact) 24.dp else 30.dp).toPx()
        val valueLabelH = 18.dp.toPx()
        val axisH = 20.dp.toPx()
        val barsH = (if (compact || metric != ChartMetric.Temperature) 0.dp else 34.dp).toPx()
        val plotTop = iconH + valueLabelH
        val plotBottom = size.height - axisH - barsH - 6.dp.toPx()
        val plotW = size.width - 2 * padX
        val n = hours.size
        val step = if (compact) 3 else if (n > 12) 3 else 2

        val values = hours.map(metric.value)
        val (vMin, vMax) = when (metric) {
            ChartMetric.Temperature -> (values.min() - 1) to (values.max() + 1)
            ChartMetric.Humidity -> 0.0 to 100.0
            ChartMetric.Wind -> 0.0 to max(values.max() + 3, 10.0)
            ChartMetric.Uv -> 0.0 to max(values.max() + 1, 6.0)
        }
        fun x(i: Int) = padX + plotW * i / (n - 1)
        fun y(v: Double) = (plotBottom - (v - vMin) / (vMax - vMin) * (plotBottom - plotTop)).toFloat()

        for (k in 0..2) {
            val gy = plotTop + (plotBottom - plotTop) * k / 2
            drawLine(grid, Offset(padX, gy), Offset(size.width - padX, gy), strokeWidth = 1.dp.toPx())
        }

        val path = Path().apply {
            moveTo(x(0), y(values[0]))
            for (i in 1 until n) {
                val mx = (x(i - 1) + x(i)) / 2
                cubicTo(mx, y(values[i - 1]), mx, y(values[i]), x(i), y(values[i]))
            }
        }
        val fill = Path().apply { addPath(path); lineTo(x(n - 1), plotBottom); lineTo(x(0), plotBottom); close() }
        drawPath(fill, Brush.verticalGradient(listOf(line.copy(alpha = 0.28f), line.copy(alpha = 0f)), startY = plotTop, endY = plotBottom))
        drawPath(path, line, style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round))

        if (barsH > 0) {
            val bw = plotW / n * 0.55f
            val base = size.height - axisH
            hours.forEachIndexed { i, h ->
                if (h.prob < 10) return@forEachIndexed
                val bh = barsH * h.prob / 100f
                drawRoundRect(rain.copy(alpha = 0.55f), Offset(x(i) - bw / 2, base - bh), Size(bw, bh.coerceAtLeast(1.5.dp.toPx())), CornerRadius(2.dp.toPx()))
            }
        }

        hours.forEachIndexed { i, h ->
            drawCircle(Color.White, 4.5.dp.toPx(), Offset(x(i), y(values[i])))
            drawCircle(line, 3.dp.toPx(), Offset(x(i), y(values[i])))
            if (i % step == 0) {
                val icon = tm.measure(WeatherIcons.emoji(h.code), TextStyle(fontSize = if (compact) 15.sp else 19.sp))
                drawText(icon, topLeft = Offset(x(i) - icon.size.width / 2f, (iconH - icon.size.height) / 2f))
                val t = tm.measure(metric.fmt(values[i]), TextStyle(fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = strong))
                drawText(t, topLeft = Offset(x(i) - t.size.width / 2f, iconH + (valueLabelH - t.size.height) / 2f - 1.dp.toPx()))
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

/** Pantalla completa del tiempo. */
@Composable
fun WeatherView(data: WeatherData, today: LocalDate = LocalDate.now()) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        SummaryCard(data)
        ChartCard(data)
        RainOutlookCard(data)
        if (data.sunrise.isNotEmpty() && data.sunset.isNotEmpty()) SunCard(data)
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            WindCard(data, Modifier.weight(1f))
            HumidityCard(data, Modifier.weight(1f))
        }
        UvCard(data)
        MoonCard(today)
        HourlyList(data)
        if (data.rainYesterday != null && data.rainYear != null) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatTile("🌧️", "Ayer", if (data.rainYesterday >= 0.1) "${num(data.rainYesterday)} l/m²" else "Sin lluvia", Modifier.weight(1f))
                StatTile("📅", "Acumulado ${data.year}", "${num(data.rainYear)} l/m²", Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun SummaryCard(data: WeatherData) {
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
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ChartCard(data: WeatherData) {
    var metric by remember { mutableStateOf(ChartMetric.Temperature) }
    AppCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(horizontal = 6.dp, vertical = 14.dp)) {
            Text("Próximas horas", style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(start = 12.dp, bottom = 8.dp))
            Row(Modifier.padding(horizontal = 10.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                ChartMetric.entries.forEach {
                    FilterChip(selected = metric == it, onClick = { metric = it }, label = { Text(it.label, style = MaterialTheme.typography.labelMedium) })
                }
            }
            HourlyChart(data.hours, metric = metric, modifier = Modifier.padding(top = 6.dp))
            Text(
                if (metric == ChartMetric.Temperature) "Línea: temperatura · Barras: probabilidad de lluvia" else "Línea: " + when (metric) { ChartMetric.Humidity -> "humedad relativa (%)"; ChartMetric.Wind -> "velocidad del viento (km/h)"; ChartMetric.Uv -> "índice UV"; else -> "temperatura" },
                style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(start = 12.dp, top = 4.dp),
            )
        }
    }
}

@Composable
private fun CardTitle(emoji: String, title: String, trailing: String? = null) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(emoji, fontSize = 18.sp)
        Spacer(Modifier.width(8.dp))
        Text(title, style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
        trailing?.let { Text(it, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
    }
}

/** Cuándo y cuánto va a llover. */
@Composable
private fun RainOutlookCard(data: WeatherData) {
    val windows = data.rainWindows()
    val accents = LocalAccents.current
    AppCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            CardTitle(if (windows.isEmpty()) "☀️" else "🌦️", "Lluvia prevista", "próximas ${data.hours.size} h")
            if (windows.isEmpty()) {
                Text("No se espera lluvia en las próximas ${data.hours.size} horas.", style = MaterialTheme.typography.bodyMedium)
            } else {
                val total = windows.sumOf { it.mm }
                Text(
                    if (total >= 0.1) "Se esperan unos ${num(total)} l/m² en total." else "Posibles chubascos sin acumulación notable.",
                    style = MaterialTheme.typography.bodyMedium,
                )
                windows.forEach { w ->
                    Row(
                        Modifier.fillMaxWidth().clip(MaterialTheme.shapes.medium).background(accents.weather.copy(alpha = 0.10f)).padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text("%02d:00 – %02d:00".format(w.fromHour, w.toHour), style = MaterialTheme.typography.titleSmall)
                            Text("Probabilidad máxima ${w.maxProb} %", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        SmallChip(if (w.mm >= 0.1) "${num(w.mm)} l/m²" else "< 0,1 l/m²", accents.weather, null)
                    }
                }
            }
        }
    }
}

private fun minutes(clock: String): Int = runCatching { LocalTime.parse(clock).let { it.hour * 60 + it.minute } }.getOrDefault(0)

/** Arco del sol: amanecer, anochecer, posición actual y horas de luz. */
@Composable
private fun SunCard(data: WeatherData) {
    val tm = rememberTextMeasurer()
    val a = LocalAccents.current
    val rise = minutes(data.sunrise); val set = minutes(data.sunset)
    val nowMin = LocalTime.now().let { it.hour * 60 + it.minute }
    val frac = ((nowMin - rise).toFloat() / (set - rise).coerceAtLeast(1)).coerceIn(0f, 1f)
    val daylight = set - rise
    val track = MaterialTheme.colorScheme.outlineVariant
    val label = MaterialTheme.colorScheme.onSurfaceVariant
    val strong = MaterialTheme.colorScheme.onSurface
    val sun = a.markets

    AppCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            CardTitle("🌅", "Amanecer y anochecer", "${daylight / 60} h ${daylight % 60} min de luz")
            Canvas(Modifier.fillMaxWidth().height(160.dp)) {
                val padX = 36.dp.toPx()
                val baseY = size.height - 44.dp.toPx()
                val rx = (size.width - 2 * padX) / 2
                val ry = baseY - 24.dp.toPx() // el arco cabe en la altura disponible
                val cx = size.width / 2
                val oval = androidx.compose.ui.geometry.Rect(cx - rx, baseY - ry, cx + rx, baseY + ry)
                drawLine(track, Offset(padX - 14.dp.toPx(), baseY), Offset(size.width - padX + 14.dp.toPx(), baseY), strokeWidth = 1.5.dp.toPx())
                val full = Path().apply { arcTo(oval, 180f, 180f, true) }
                drawPath(full, track, style = Stroke(width = 2.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f))))
                val done = Path().apply { arcTo(oval, 180f, 180f * frac, true) }
                drawPath(done, sun, style = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round))
                // Sol (o luna si es de noche) en su posición actual.
                val ang = Math.PI * (1 - frac)
                val px = cx + (rx * cos(ang)).toFloat()
                val py = baseY - (ry * sin(ang)).toFloat()
                val night = nowMin < rise || nowMin > set
                val glyph = tm.measure(if (night) "🌙" else "☀️", TextStyle(fontSize = 22.sp))
                drawCircle(sun.copy(alpha = 0.18f), 19.dp.toPx(), Offset(px, py))
                drawText(glyph, topLeft = Offset(px - glyph.size.width / 2f, py - glyph.size.height / 2f))
                // Horas bajo los extremos del arco.
                val t1 = tm.measure(data.sunrise, TextStyle(fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = strong))
                val t2 = tm.measure(data.sunset, TextStyle(fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = strong))
                drawText(t1, topLeft = Offset(padX - t1.size.width / 2f, baseY + 8.dp.toPx()))
                drawText(t2, topLeft = Offset(size.width - padX - t2.size.width / 2f, baseY + 8.dp.toPx()))
                val l1 = tm.measure("Amanece", TextStyle(fontSize = 11.sp, color = label))
                val l2 = tm.measure("Anochece", TextStyle(fontSize = 11.sp, color = label))
                drawText(l1, topLeft = Offset(padX - l1.size.width / 2f, baseY + 8.dp.toPx() + t1.size.height))
                drawText(l2, topLeft = Offset(size.width - padX - l2.size.width / 2f, baseY + 8.dp.toPx() + t2.size.height))
            }
        }
    }
}

@Composable
private fun WindCard(data: WeatherData, modifier: Modifier = Modifier) {
    val first = data.hours.firstOrNull()
    val a = LocalAccents.current
    AppCard(modifier) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            CardTitle("💨", "Viento")
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(64.dp), contentAlignment = Alignment.Center) {
                    val ring = MaterialTheme.colorScheme.outlineVariant
                    Canvas(Modifier.fillMaxSize()) { drawCircle(ring, size.minDimension / 2 - 1.dp.toPx(), style = Stroke(2.dp.toPx())) }
                    // La flecha apunta hacia donde sopla el viento (la dirección meteorológica es de dónde viene).
                    Text("↑", fontSize = 30.sp, color = a.news, fontWeight = FontWeight.Bold, modifier = Modifier.rotate((data.windDir + 180f) % 360f))
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text("${(first?.wind ?: data.windMax).roundToInt()} km/h", style = MaterialTheme.typography.titleLarge)
                    Text("del ${WeatherData.compass(first?.windDir ?: data.windDir)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Text("Máx. hoy ${data.windMax.roundToInt()} km/h · rachas ${data.gustMax.roundToInt()}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun HumidityCard(data: WeatherData, modifier: Modifier = Modifier) {
    val h = data.hours.map { it.humidity }
    val now = h.firstOrNull() ?: 0
    val level = when { now < 30 -> "Seco"; now < 60 -> "Confortable"; now < 80 -> "Húmedo"; else -> "Muy húmedo" }
    val a = LocalAccents.current
    AppCard(modifier) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            CardTitle("💧", "Humedad")
            Text("$now %", style = MaterialTheme.typography.titleLarge)
            Text(level, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            LinearProgressIndicator(progress = { now / 100f }, modifier = Modifier.fillMaxWidth().height(8.dp).clip(CircleShape), color = a.agenda, trackColor = a.agenda.copy(alpha = 0.15f))
            if (h.isNotEmpty()) Text("Hoy ${h.min()}–${h.max()} %", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

private fun uvLevel(uv: Double) = when {
    uv < 3 -> "Bajo" to "No necesitas protección especial."
    uv < 6 -> "Moderado" to "Usa gafas y protección si estás mucho al sol."
    uv < 8 -> "Alto" to "Protección solar y evita las horas centrales."
    uv < 11 -> "Muy alto" to "Protección imprescindible; busca sombra al mediodía."
    else -> "Extremo" to "Evita el sol directo en las horas centrales."
}

/** Índice UV máximo con escala de color y radiación solar del día. */
@Composable
private fun UvCard(data: WeatherData) {
    val (level, advice) = uvLevel(data.uvMax)
    val peak = data.hours.maxOfOrNull { it.radiation } ?: 0.0
    AppCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            CardTitle("🕶️", "Radiación ultravioleta", "UV máx. ${num(data.uvMax)}")
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(num(data.uvMax), style = MaterialTheme.typography.headlineMedium)
                Spacer(Modifier.width(10.dp))
                Column {
                    Text(level, style = MaterialTheme.typography.titleSmall)
                    Text(advice, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            // Escala 0–11+.
            Box(Modifier.fillMaxWidth().height(16.dp)) {
                Box(
                    Modifier.fillMaxWidth().height(8.dp).align(Alignment.Center).clip(CircleShape).background(
                        Brush.horizontalGradient(listOf(Color(0xFF4CAF50), Color(0xFFFFEB3B), Color(0xFFFF9800), Color(0xFFF44336), Color(0xFF9C27B0))),
                    ),
                )
                val frac = (data.uvMax / 11.0).coerceIn(0.0, 1.0).toFloat()
                BoxWithConstraints(Modifier.fillMaxSize()) {
                    Box(Modifier.offset(x = (maxWidth - 16.dp) * frac).size(16.dp).clip(CircleShape).background(Color.White).padding(3.dp).clip(CircleShape).background(MaterialTheme.colorScheme.onSurface))
                }
            }
            Row {
                Text("0", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
                Text("11+", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MiniStat("☀️", "Radiación hoy", "${num(data.radiationSum)} MJ/m²", Modifier.weight(1f))
                MiniStat("⚡", "Pico", "${peak.roundToInt()} W/m²", Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun MiniStat(emoji: String, title: String, value: String, modifier: Modifier = Modifier) {
    Row(modifier, verticalAlignment = Alignment.CenterVertically) {
        Text(emoji, fontSize = 22.sp)
        Spacer(Modifier.width(8.dp))
        Column {
            Text(title, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.titleSmall)
        }
    }
}

/** Fase lunar de hoy y calendario del mes con la fase de cada día. */
@Composable
private fun MoonCard(today: LocalDate) {
    val phase = MoonPhase.phase(today)
    val illum = (MoonPhase.illumination(today) * 100).roundToInt()
    val age = MoonPhase.age(today)
    val fmt = SimpleDateFormat("EEE d MMM", ES)
    fun d(date: LocalDate) = fmt.format(Date.from(date.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant())).replaceFirstChar { it.uppercase() }
    val nextFull = MoonPhase.next(today, full = true)
    val nextNew = MoonPhase.next(today, full = false)
    val ym = YearMonth.from(today)
    val offset = ym.atDay(1).dayOfWeek.value - 1 // lunes = 0

    AppCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            CardTitle("🌙", "Calendario lunar")
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(phase.emoji, fontSize = 56.sp)
                Spacer(Modifier.width(16.dp))
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(phase.name, style = MaterialTheme.typography.titleMedium)
                    Text("$illum % iluminada · ${age.roundToInt()} días", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("🌕 Próxima llena: ${d(nextFull)}", style = MaterialTheme.typography.bodySmall)
                    Text("🌑 Próxima nueva: ${d(nextNew)}", style = MaterialTheme.typography.bodySmall)
                }
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Text(SimpleDateFormat("MMMM yyyy", ES).format(Date.from(today.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant())).replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.titleSmall)
            Row(Modifier.fillMaxWidth()) {
                listOf("L", "M", "X", "J", "V", "S", "D").forEach {
                    Text(it, Modifier.weight(1f), textAlign = TextAlign.Center, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            val cells = offset + ym.lengthOfMonth()
            for (row in 0 until (cells + 6) / 7) {
                Row(Modifier.fillMaxWidth()) {
                    for (col in 0 until 7) {
                        val day = row * 7 + col - offset + 1
                        Box(Modifier.weight(1f).padding(vertical = 2.dp), contentAlignment = Alignment.Center) {
                            if (day in 1..ym.lengthOfMonth()) {
                                val date = ym.atDay(day)
                                val isToday = date == today
                                Column(
                                    Modifier.clip(RoundedCornerShape(10.dp))
                                        .background(if (isToday) MaterialTheme.colorScheme.primaryContainer else Color.Transparent)
                                        .padding(horizontal = 4.dp, vertical = 3.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                ) {
                                    Text(MoonPhase.phase(date).emoji, fontSize = 17.sp)
                                    Text("$day", style = MaterialTheme.typography.labelSmall, fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/** Una hora por fila. */
@Composable
private fun HourlyList(data: WeatherData) {
    val accents = LocalAccents.current
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
